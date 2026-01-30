const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');

// Helper to calculate distance in meters (Haversine Formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

// @desc    Check in for attendance
// @route   POST /attendance/checkin
// @access  Private (Employee)
const checkIn = async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied. Only employees can check in.' });
        }

        const { location } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.findOne({
            user: req.user._id,
            date: today
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'You have already checked in today.' });
        }

        let settings = await Settings.findOne() || {};

        // 1. Geofencing Validation
        if (settings.officeLocation && settings.officeLocation.latitude && settings.officeLocation.longitude) {
            if (!location || !location.lat || !location.lng) {
                return res.status(400).json({ message: 'Location access is required for check-in.' });
            }

            const distance = calculateDistance(
                location.lat, location.lng,
                settings.officeLocation.latitude, settings.officeLocation.longitude
            );

            if (distance > (settings.officeLocation.radius || 100)) {
                return res.status(403).json({
                    message: `Location Mismatch. You are ${Math.round(distance)}m away from office. Required radius: ${settings.officeLocation.radius || 100}m.`
                });
            }
        }

        const now = new Date();
        let status = 'present';

        // 2. Late Check-in Logic
        if (settings.workingHours && settings.workingHours.checkIn) {
            const [h, m] = settings.workingHours.checkIn.split(':').map(Number);
            const policyTime = new Date(today);
            policyTime.setHours(h, m, 0, 0);

            const graceMs = (settings.workingHours.gracePeriod || 0) * 60 * 1000;
            const limitTime = new Date(policyTime.getTime() + graceMs);

            if (now > limitTime) {
                status = 'late';
            }
        }

        const attendance = await Attendance.create({
            user: req.user._id,
            date: today,
            checkIn: now,
            status: status,
            location: { checkIn: location }
        });

        res.status(201).json(attendance);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already checked in today.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check out for attendance
// @route   POST /attendance/checkout
// @access  Private (Employee)
const checkOut = async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied. Only employees can check out.' });
        }

        const { location } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            user: req.user._id,
            date: today
        });

        if (!attendance) {
            return res.status(400).json({ message: 'Active check-in record not found for today.' });
        }

        if (attendance.checkOut) {
            return res.status(400).json({ message: 'You have already checked out today.' });
        }

        let settings = await Settings.findOne() || {};

        // 1. Protocol: Shift Timing Analysis
        const now = new Date();
        const durationMs = now - attendance.checkIn;
        const hoursWorked = durationMs / (1000 * 60 * 60);

        let standardShift = 9;
        if (settings.workingHours && settings.workingHours.checkIn && settings.workingHours.checkOut) {
            const [inH, inM] = settings.workingHours.checkIn.split(':').map(Number);
            const [outH, outM] = settings.workingHours.checkOut.split(':').map(Number);
            const shiftStart = inH + (inM / 60);
            const shiftEnd = outH + (outM / 60);

            let shiftLength = shiftEnd - shiftStart;
            if (shiftLength < 0) shiftLength += 24;
            if (shiftLength > 0) standardShift = shiftLength;
        }

        // Enforce half-day passthrough (user request: "able to click after half times of working day")
        if (hoursWorked < (standardShift / 2)) {
            return res.status(403).json({
                message: `Protocol Restriction: Check-out only allowed after half-shift (${(standardShift / 2).toFixed(1)} hrs). Currently: ${hoursWorked.toFixed(1)} hrs.`
            });
        }

        // 2. Geofencing Validation
        if (settings.officeLocation && settings.officeLocation.latitude && settings.officeLocation.longitude) {
            if (!location || !location.lat || !location.lng) {
                return res.status(400).json({ message: 'Location access is required for check-out.' });
            }
            const distance = calculateDistance(
                location.lat, location.lng,
                settings.officeLocation.latitude, settings.officeLocation.longitude
            );
            if (distance > (settings.officeLocation.radius || 100)) {
                return res.status(403).json({ message: `Location Mismatch. You must be within office proximity to check out.` });
            }
        }

        attendance.checkOut = now;
        attendance.workingHours = hoursWorked.toFixed(2);

        if (hoursWorked > standardShift) {
            attendance.overtimeHours = (hoursWorked - standardShift).toFixed(2);
        }

        // Preserve status (present/late) unless hours are extremely low (sanity check)
        if (hoursWorked < 4 && attendance.status !== 'late') {
            attendance.status = 'half_day';
        }

        if (location) {
            attendance.location.checkOut = location;
        }

        await attendance.save();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update attendance timing (Admin only)
// @route   PUT /attendance/admin/update/:attendanceId
// @access  Private (Admin/Sub-admin)
const updateAttendanceTiming = async (req, res) => {
    try {
        const { checkIn, checkOut } = req.body;
        const { attendanceId } = req.params;

        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        const settings = await Settings.findOne() || {};

        // Update check-in if provided
        if (checkIn) {
            attendance.checkIn = new Date(checkIn);
        }

        // Update check-out if provided
        if (checkOut) {
            attendance.checkOut = new Date(checkOut);
        }

        // Recalculate working hours if both times exist
        if (attendance.checkIn && attendance.checkOut) {
            const durationMs = attendance.checkOut - attendance.checkIn;
            const hoursWorked = durationMs / (1000 * 60 * 60);
            attendance.workingHours = hoursWorked.toFixed(2);

            // Calculate standard shift
            let standardShift = 9;
            if (settings.workingHours && settings.workingHours.checkIn && settings.workingHours.checkOut) {
                const [inH, inM] = settings.workingHours.checkIn.split(':').map(Number);
                const [outH, outM] = settings.workingHours.checkOut.split(':').map(Number);
                const shiftStart = inH + (inM / 60);
                const shiftEnd = outH + (outM / 60);
                let shiftLength = shiftEnd - shiftStart;
                if (shiftLength < 0) shiftLength += 24;
                if (shiftLength > 0) standardShift = shiftLength;
            }

            // Calculate overtime
            if (hoursWorked > standardShift) {
                attendance.overtimeHours = (hoursWorked - standardShift).toFixed(2);
            } else {
                attendance.overtimeHours = 0;
            }

            // Update status based on hours worked
            if (hoursWorked < 4) {
                attendance.status = 'half_day';
            } else if (hoursWorked < standardShift * 0.8) {
                attendance.status = 'half_day';
            } else {
                // Check if late based on check-in time
                if (settings.workingHours && settings.workingHours.checkIn) {
                    const [h, m] = settings.workingHours.checkIn.split(':').map(Number);
                    const checkInDate = new Date(attendance.checkIn);
                    const policyTime = new Date(checkInDate);
                    policyTime.setHours(h, m, 0, 0);

                    const graceMs = (settings.workingHours.gracePeriod || 0) * 60 * 1000;
                    const limitTime = new Date(policyTime.getTime() + graceMs);

                    if (checkInDate > limitTime) {
                        attendance.status = 'late';
                    } else {
                        attendance.status = 'present';
                    }
                } else {
                    attendance.status = 'present';
                }
            }
        }

        await attendance.save();
        res.json({ message: 'Attendance timing updated successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create manual attendance record (Admin only)
// @route   POST /attendance/admin/create
// @access  Private (Admin/Sub-admin)
const createManualAttendance = async (req, res) => {
    try {
        const { userId, date, checkIn, checkOut, status, notes } = req.body;

        if (!userId || !date) {
            return res.status(400).json({ message: 'User ID and date are required' });
        }

        // Check if attendance already exists for this date
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.findOne({
            user: userId,
            date: dateObj
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance record already exists for this date' });
        }

        const settings = await Settings.findOne() || {};

        // Create attendance object
        const attendanceData = {
            user: userId,
            date: dateObj,
            status: status || 'present',
            notes: notes || 'Manually created by admin'
        };

        // Add check-in if provided
        if (checkIn) {
            attendanceData.checkIn = new Date(checkIn);
        }

        // Add check-out if provided
        if (checkOut) {
            attendanceData.checkOut = new Date(checkOut);
        }

        // Calculate working hours if both times exist
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const durationMs = checkOutDate - checkInDate;
            const hoursWorked = durationMs / (1000 * 60 * 60);
            attendanceData.workingHours = hoursWorked.toFixed(2);

            // Calculate standard shift
            let standardShift = 9;
            if (settings.workingHours && settings.workingHours.checkIn && settings.workingHours.checkOut) {
                const [inH, inM] = settings.workingHours.checkIn.split(':').map(Number);
                const [outH, outM] = settings.workingHours.checkOut.split(':').map(Number);
                const shiftStart = inH + (inM / 60);
                const shiftEnd = outH + (outM / 60);
                let shiftLength = shiftEnd - shiftStart;
                if (shiftLength < 0) shiftLength += 24;
                if (shiftLength > 0) standardShift = shiftLength;
            }

            // Calculate overtime
            if (hoursWorked > standardShift) {
                attendanceData.overtimeHours = (hoursWorked - standardShift).toFixed(2);
            }

            // Auto-determine status if not provided
            if (!status) {
                if (hoursWorked < 4) {
                    attendanceData.status = 'half_day';
                } else {
                    attendanceData.status = 'present';
                }
            }
        }

        const attendance = await Attendance.create(attendanceData);
        res.status(201).json({ message: 'Manual attendance record created successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get daily attendance for a user
// @route   GET /attendance/daily/:userId
// @access  Private
const getDailyAttendance = async (req, res) => {
    try {
        // Only admin/sub-admin can view others, or the user themselves
        if (req.user.role === 'employee' && req.user._id.toString() !== req.params.userId) {
            return res.status(401).json({ message: 'Not authorized to view this attendance' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            user: req.params.userId,
            date: today
        });

        if (attendance) {
            res.json(attendance);
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get monthly attendance for a user
// @route   GET /attendance/monthly/:userId
// @access  Private
const getMonthlyAttendance = async (req, res) => {
    try {
        if (req.user.role === 'employee' && req.user._id.toString() !== req.params.userId) {
            return res.status(401).json({ message: 'Not authorized to view this attendance' });
        }

        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Please provide month and year' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendanceList = await Attendance.find({
            user: req.params.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // Fetch user's joining date
        const user = await User.findById(req.params.userId);
        let joiningDate = null;
        if (user && user.joiningDate) {
            joiningDate = new Date(user.joiningDate);
            joiningDate.setHours(0, 0, 0, 0);
        }

        // Fetch Holidays for this period
        const holidays = await Holiday.find({
            date: { $gte: startDate, $lte: endDate }
        });

        // Merge holidays into attendance list if no log exists
        holidays.forEach(h => {
            const hDate = new Date(h.date);
            hDate.setHours(0, 0, 0, 0);

            const hasLog = attendanceList.some(a => {
                const d = new Date(a.date);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === hDate.getTime();
            });

            if (!hasLog) {
                attendanceList.push({
                    user: req.params.userId,
                    date: h.date,
                    status: 'holiday',
                    leaveType: h.name,
                    isMissingRecord: true
                });
            }
        });

        // Filter for Missing Records (Abscence check excluding today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const settings = await Settings.findOne() || {};
        const weekendPolicy = settings.weekendPolicy || ['Sat', 'Sun'];

        for (let d = new Date(startDate); d <= (endDate < today ? endDate : new Date(today.getTime() - 86400000)); d.setDate(d.getDate() + 1)) {
            const currentD = new Date(d);
            currentD.setHours(0, 0, 0, 0);

            // Skip dates before joining date
            if (joiningDate && currentD < joiningDate) {
                continue;
            }

            const hasRecord = attendanceList.some(a => {
                const ad = new Date(a.date);
                ad.setHours(0, 0, 0, 0);
                return ad.getTime() === currentD.getTime();
            });

            if (!hasRecord) {
                // Check if weekend
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = dayNames[currentD.getDay()];

                if (!weekendPolicy.includes(dayName)) {
                    // Check if on approved leave
                    const leave = await Leave.findOne({
                        user: req.params.userId,
                        status: 'approved',
                        startDate: { $lte: currentD },
                        endDate: { $gte: currentD }
                    });

                    let status = 'absent';
                    let leaveType = '';

                    if (leave) {
                        status = leave.leaveDuration === 0.5 ? 'half_day' : 'leave';
                        leaveType = leave.leaveType || '';
                    }

                    attendanceList.push({
                        user: req.params.userId,
                        date: new Date(currentD),
                        status,
                        leaveType,
                        isMissingRecord: true
                    });
                }
            }
        }

        // Logic for today (if in current month) - Check if weekend or on leave if not checked in
        if (today >= startDate && today <= endDate) {
            // Skip if employee hasn't joined yet
            if (!joiningDate || today >= joiningDate) {
                const hasToday = attendanceList.some(a => {
                    const ad = new Date(a.date);
                    ad.setHours(0, 0, 0, 0);
                    return ad.getTime() === today.getTime();
                });

                if (!hasToday) {
                    // Determine if it's a weekend or approved leave
                    const leave = await Leave.findOne({
                        user: req.params.userId,
                        status: 'approved',
                        startDate: { $lte: today },
                        endDate: { $gte: today }
                    });

                    let status = 'absent'; // Default for "not yet checked in"
                    let leaveType = '';

                    if (leave) {
                        status = leave.leaveDuration === 0.5 ? 'half_day' : 'leave';
                        leaveType = leave.leaveType || '';
                    } else {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const dayName = dayNames[today.getDay()];
                        if (weekendPolicy.includes(dayName)) {
                            status = 'weekend';
                        }
                    }

                    // Push a virtual record for today
                    attendanceList.push({
                        user: req.params.userId,
                        date: new Date(today),
                        status,
                        leaveType,
                        isMissingRecord: true
                    });
                }
            }
        }

        res.json(attendanceList.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get attendance summary (Admin)
// @route   GET /attendance/summary
// @access  Private (Admin/Sub-Admin)
const getAttendanceSummary = async (req, res) => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const startOfToday = new Date(todayStr + 'T00:00:00');
        const endOfToday = new Date(todayStr + 'T23:59:59');

        console.log('Fetching Attendance Summary for:', startOfToday, 'to', endOfToday);

        const totalEmployees = await User.countDocuments({ role: 'employee', status: 'active' });

        // 1. Get all attendance logs for today
        const attendanceLogs = await Attendance.find({
            date: { $gte: startOfToday, $lte: endOfToday }
        }).select('user status');

        // 2. Get all approved leaves for today
        const leaves = await Leave.find({
            status: 'approved',
            startDate: { $lte: new Date(today.getTime() + 23 * 59 * 59 * 999) },
            endDate: { $gte: today }
        }).select('user leaveDuration');

        // Logic to categorize employees (Priority: Present/Late > Half Day > On Leave > Absent)
        let presentSet = new Set();
        let halfDaySet = new Set();
        let onLeaveSet = new Set();

        attendanceLogs.forEach(log => {
            if (['present', 'late'].includes(log.status)) {
                presentSet.add(log.user.toString());
            } else if (log.status === 'half_day') {
                halfDaySet.add(log.user.toString());
            }
        });

        leaves.forEach(l => {
            const userId = l.user.toString();
            // Only add to halfDay if not already present
            if (l.leaveDuration === 0.5) {
                if (!presentSet.has(userId)) {
                    halfDaySet.add(userId);
                }
            } else {
                // Full day leave - only if not already present/half-day worked
                if (!presentSet.has(userId) && !halfDaySet.has(userId)) {
                    onLeaveSet.add(userId);
                }
            }
        });

        const presentCount = presentSet.size;
        const halfDayCount = halfDaySet.size;
        const onLeaveCount = onLeaveSet.size;
        const absentCount = Math.max(0, totalEmployees - (presentCount + halfDayCount + onLeaveCount));

        console.log('Summary Result:', { totalEmployees, present: presentCount, halfDay: halfDayCount, onLeave: onLeaveCount, absent: absentCount });

        res.json({
            date: today,
            totalEmployees,
            present: presentCount,
            absent: absentCount,
            halfDay: halfDayCount,
            onLeave: onLeaveCount
        });
    } catch (error) {
        console.error('Get Attendance Summary Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all attendance logs (filtering supported)
// @route   GET /attendance/logs
// @access  Private (Admin/Sub-Admin)
const getAllAttendance = async (req, res) => {
    const { startDate, endDate, status, userId } = req.query;

    let query = {};
    if (userId) {
        query.user = userId;
    }

    // Date Filter
    if (startDate && endDate) {
        // Force local date parsing with T00:00:00
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        query.date = {
            $gte: start,
            $lte: end
        };
    } else if (startDate) {
        query.date = { $gte: new Date(startDate + 'T00:00:00') };
    }

    // Status Filter
    if (status && status !== 'All') {
        query.status = status.toLowerCase();
    }

    // Fetch existing logs
    const logs = await Attendance.find(query)
        .populate('user', 'name email designation status')
        .sort({ date: -1 });

    // If it's a single day view (e.g., today), include all active employees
    if (startDate && (startDate === endDate || !endDate)) {
        // Normalize todayDate for robust comparison
        const todayDate = new Date(startDate + 'T00:00:00');
        todayDate.setHours(0, 0, 0, 0);

        // Fetch all employees joined on or before todayDate
        const activeUsers = await User.find({
            role: 'employee',
            status: 'active',
            ...(userId ? { _id: userId } : {})
        }).select('name email designation joiningDate');

        // Filter out those who haven't joined yet
        const eligibleUsers = activeUsers.filter(u => {
            if (!u.joiningDate) return true; // Default to eligible if no joining date
            const jDate = new Date(u.joiningDate);
            jDate.setHours(0, 0, 0, 0);
            return jDate <= todayDate;
        });

        const loggedUserIds = logs.map(l => l.user ? l.user._id.toString() : null);

        const missingUsers = eligibleUsers.filter(u => !loggedUserIds.includes(u._id.toString()));

        const holiday = await Holiday.findOne({
            date: {
                $gte: todayDate,
                $lt: new Date(todayDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        const missingLogs = await Promise.all(missingUsers.map(async (u) => {
            // Priority 1: Holiday
            if (holiday) {
                return {
                    user: u,
                    date: todayDate,
                    status: 'holiday',
                    leaveType: holiday.name,
                    isMissingRecord: true
                };
            }
            // Check if user is on approved leave today
            // Use a slightly wider window to account for any timezone/time offset issues
            const startOfToday = new Date(todayDate);
            const endOfToday = new Date(todayDate);
            endOfToday.setHours(23, 59, 59, 999);

            const leave = await Leave.findOne({
                user: u._id,
                status: 'approved',
                $or: [
                    { startDate: { $lte: endOfToday }, endDate: { $gte: startOfToday } },
                    { startDate: { $gte: startOfToday, $lte: endOfToday } }
                ]
            });

            if (leave) {
                return {
                    user: u,
                    date: todayDate,
                    status: leave.leaveDuration === 0.5 ? 'half_day' : 'leave', // Differentiate half-day vs full-day
                    leaveType: leave.leaveType,
                    leaveDuration: leave.leaveDuration || 1,
                    isMissingRecord: true
                };
            }

            // Check if it's a weekend based on policy
            const settings = await Settings.findOne() || {};
            const weekendPolicy = settings.weekendPolicy || ['Sat', 'Sun'];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[todayDate.getDay()];

            if (weekendPolicy.includes(dayName)) {
                return {
                    user: u,
                    date: todayDate,
                    status: 'weekend',
                    isMissingRecord: true
                };
            }

            return {
                user: u,
                date: todayDate,
                status: 'absent',
                isMissingRecord: true
            };
        }));

        return res.json([...logs, ...missingLogs]);
    }

    res.json(logs);
};

const exportAttendanceToExcel = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide startDate and endDate' });
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');

        // Fetch all active employees
        const employees = await User.find({
            role: 'employee',
            status: 'active',
            ...(userId ? { _id: userId } : {})
        }).select('name email designation joiningDate').sort({ name: 1 });

        // Fetch attendance logs for the period
        const logs = await Attendance.find({
            date: { $gte: start, $lte: end },
            ...(userId ? { user: userId } : {})
        }).populate('user', 'name');

        // Fetch holidays
        const holidayList = await Holiday.find({
            date: { $gte: start, $lte: end }
        });

        // Fetch leaves
        const leaves = await Leave.find({
            status: 'approved',
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        // Fetch settings for weekend policy
        const settings = await Settings.findOne() || {};
        const weekendPolicy = settings.weekendPolicy || ['Sat', 'Sun'];

        const XLSX = require('xlsx');

        // Prepare dates array
        const dates = [];
        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        // Prepare Header
        const header = ['Date', 'Employee Name', 'Email', 'Designation', 'Check-In', 'Check-Out', 'Utilization (Hrs)', 'Status'];

        // Prepare Data Rows
        const dataRows = [];

        dates.forEach(date => {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[date.getDay()];
            const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

            employees.forEach(emp => {
                let checkIn = '--:--';
                let checkOut = '--:--';
                let utilization = '0';
                let status = 'Absent';

                // 1. Check Holiday
                const holiday = holidayList.find(h => new Date(h.date).toDateString() === date.toDateString());
                if (holiday) {
                    status = `Holiday (${holiday.name})`;
                } else if (weekendPolicy.includes(dayName)) {
                    // 2. Check Weekend
                    status = 'Weekend';
                } else {
                    // 3. Check Attendance Log
                    const log = logs.find(l => {
                        if (!l.user) return false;
                        const logUserId = l.user._id ? l.user._id.toString() : l.user.toString();
                        const targetUserId = emp._id ? emp._id.toString() : emp.toString();

                        const logDate = new Date(l.date);
                        return logUserId === targetUserId && logDate.toDateString() === date.toDateString();
                    });
                    if (log) {
                        checkIn = log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
                        checkOut = log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
                        utilization = log.workingHours || '0';
                        status = log.status.charAt(0).toUpperCase() + log.status.slice(1).replace('_', ' ');
                    } else {
                        // 4. Check Leave
                        const leave = leaves.find(lv => lv.user.toString() === emp._id.toString() && new Date(lv.startDate) <= date && new Date(lv.endDate) >= date);
                        if (leave) {
                            status = `Leave (${leave.leaveType || 'General'})`;
                        }
                    }
                }

                dataRows.push([
                    dateStr,
                    emp.name,
                    emp.email,
                    emp.designation || '--',
                    checkIn,
                    checkOut,
                    utilization,
                    status
                ]);
            });
        });

        // Create Workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);

        // Auto-width for columns
        const colWidths = header.map((h, i) => {
            let maxLen = h.length;
            dataRows.forEach(row => {
                const cellVal = String(row[i] || '');
                if (cellVal.length > maxLen) maxLen = cellVal.length;
            });
            return { wch: maxLen + 2 };
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Details');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="Attendance_Register_${startDate}_to_${endDate}.xlsx"`,
            'Content-Length': buffer.length
        });

        res.send(buffer);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ message: 'Internal Server Error during export' });
    }
};

module.exports = {
    checkIn,
    checkOut,
    updateAttendanceTiming,
    createManualAttendance,
    getDailyAttendance,
    getMonthlyAttendance,
    getAttendanceSummary,
    getAllAttendance,
    exportAttendanceToExcel
};
