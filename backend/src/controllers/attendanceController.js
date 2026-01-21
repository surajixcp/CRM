const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');

// @desc    Check in for attendance
// @route   POST /attendance/checkin
// @access  Private (Employee)
const checkIn = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
        user: req.user._id,
        date: today
    });

    if (existingAttendance) {
        res.status(400).json({ message: 'You have already checked in today.' });
        return;
    }

    // Fetch settings for policy check
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({}); // Default settings
    }

    const now = new Date();
    let status = 'present';

    // Late Check-in Logic
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
        status: status
    });

    res.status(201).json(attendance);
};

// @desc    Check out for attendance
// @route   POST /attendance/checkout
// @access  Private (Employee)
const checkOut = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
        user: req.user._id,
        date: today
    });

    if (!attendance) {
        res.status(400).json({ message: 'You have not checked in today.' });
        return;
    }

    if (attendance.checkOut) {
        res.status(400).json({ message: 'You have already checked out today.' });
        return;
    }

    attendance.checkOut = new Date();

    // Calculate working hours
    const duration = attendance.checkOut - attendance.checkIn; // milliseconds
    const hours = duration / (1000 * 60 * 60);
    attendance.workingHours = hours.toFixed(2);

    // Dynamic Overtime Calculation
    let settings = await Settings.findOne();
    let standardShift = 9; // Default fallback (hours)

    if (settings && settings.workingHours && settings.workingHours.checkIn && settings.workingHours.checkOut) {
        const [inH, inM] = settings.workingHours.checkIn.split(':').map(Number);
        const [outH, outM] = settings.workingHours.checkOut.split(':').map(Number);

        // Calculate shift length in hours
        const shiftStart = inH + (inM / 60);
        const shiftEnd = outH + (outM / 60);

        let shiftLength = shiftEnd - shiftStart;
        if (shiftLength < 0) shiftLength += 24; // Handling night shifts

        if (shiftLength > 0) standardShift = shiftLength;
    }

    if (hours > standardShift) {
        attendance.overtimeHours = (hours - standardShift).toFixed(2);
    }

    await attendance.save();

    res.json(attendance);
};

// @desc    Get daily attendance for a user
// @route   GET /attendance/daily/:userId
// @access  Private
const getDailyAttendance = async (req, res) => {
    // Only admin/sub-admin can view others, or the user themselves
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.userId) {
        res.status(401).json({ message: 'Not authorized to view this attendance' });
        return;
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
};

// @desc    Get monthly attendance for a user
// @route   GET /attendance/monthly/:userId
// @access  Private
const getMonthlyAttendance = async (req, res) => {
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.userId) {
        res.status(401).json({ message: 'Not authorized to view this attendance' });
        return;
    }

    const { month, year } = req.query;

    if (!month || !year) {
        res.status(400).json({ message: 'Please provide month and year' });
        return;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceList = await Attendance.find({
        user: req.params.userId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Fetch Holidays for this period
    const Holiday = require('../models/Holiday');
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
                leaveType: h.name, // Use holiday name as leaveType if helpful
                isMissingRecord: true
            });
        }
    });

    attendanceList.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Proactive detection for "Today" if it falls within the month/year
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today >= startDate && today <= endDate) {
        // Fetch user to check joining date
        const User = require('../models/User');
        const user = await User.findById(req.params.userId).select('joiningDate');

        const jDate = user && user.joiningDate ? new Date(user.joiningDate) : null;
        if (jDate) jDate.setHours(0, 0, 0, 0);

        // Skip if today is before joining person
        if (jDate && today < jDate) {
            return res.json(attendanceList);
        }

        const hasTodayRecord = attendanceList.some(a => {
            const d = new Date(a.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });

        if (!hasTodayRecord) {
            const Leave = require('../models/Leave');
            const Settings = require('../models/Settings');

            // Re-use logic from getAllAttendance for consistency
            const startOfToday = new Date(today);
            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            const leave = await Leave.findOne({
                user: req.params.userId,
                status: 'approved',
                $or: [
                    { startDate: { $lte: endOfToday }, endDate: { $gte: startOfToday } },
                    { startDate: { $gte: startOfToday, $lte: endOfToday } }
                ]
            });

            let status = 'absent';
            let leaveType = null;

            if (leave) {
                status = 'leave';
                leaveType = leave.leaveType;
            } else {
                const settings = await Settings.findOne() || {};
                const weekendPolicy = settings.weekendPolicy || ['Sat', 'Sun'];
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = dayNames[today.getDay()];
                if (weekendPolicy.includes(dayName)) {
                    status = 'weekend';
                }
            }

            // Push a virtual record for today
            attendanceList.push({
                user: req.params.userId,
                date: today,
                status,
                leaveType,
                isMissingRecord: true
            });
        }
    }

    res.json(attendanceList);
};


// @desc    Get attendance summary (Admin)
// @route   GET /attendance/summary
// @access  Private (Admin/Sub-Admin)
const getAttendanceSummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const User = require('../models/User'); // Ensure it's required at least once in this file or above
        const totalEmployees = await User.countDocuments({ role: 'employee', status: 'active' });
        const presentCount = await Attendance.countDocuments({ date: today, status: 'present' });
        const absentCount = totalEmployees - presentCount; // Simplified logic

        res.json({
            date: today,
            totalEmployees,
            present: presentCount,
            absent: absentCount
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
    const { startDate, endDate, status } = req.query;

    let query = {};

    // Date Filter
    if (startDate && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date = {
            $gte: new Date(startDate),
            $lte: end
        };
    } else if (startDate) {
        query.date = { $gte: new Date(startDate) };
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
        const User = require('../models/User');
        const Leave = require('../models/Leave');

        // Normalize todayDate for robust comparison
        const todayDate = new Date(startDate);
        todayDate.setHours(0, 0, 0, 0);

        // Fetch all employees joined on or before todayDate
        const activeUsers = await User.find({
            role: 'employee',
            status: 'active'
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

        const Settings = require('../models/Settings');
        const Holiday = require('../models/Holiday');

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
                    status: 'leave', // Proactively marked as leave
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

module.exports = {
    checkIn,
    checkOut,
    getDailyAttendance,
    getMonthlyAttendance,
    getAttendanceSummary,
    getAllAttendance
};
