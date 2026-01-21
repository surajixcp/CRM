const Leave = require('../models/Leave');

// @desc    Apply for leave
// @route   POST /leaves/apply
// @access  Private
const applyLeave = async (req, res) => {
    const { leaveType, reason, startDate, endDate, leaveDuration } = req.body;

    // Normalizing today's date for comparison (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const duration = leaveDuration || 1;

    // Validation
    if (start < today) {
        return res.status(400).json({ message: 'Cannot apply for leave on past dates.' });
    }

    if (duration === 1 && start.getTime() === today.getTime()) {
        return res.status(400).json({
            message: 'Full-day leave must be requested at least one day in advance. Same-day full-day applications are not permitted.'
        });
    }

    const end = duration === 0.5 ? start : new Date(endDate);

    // Check for overlapping leaves (pending or approved)
    const overlappingLeave = await Leave.findOne({
        user: req.user._id,
        status: { $in: ['pending', 'approved'] },
        $or: [
            { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
    });

    if (overlappingLeave) {
        return res.status(400).json({
            message: `You already have a ${overlappingLeave.status} leave request for these dates (${new Date(overlappingLeave.startDate).toLocaleDateString()} - ${new Date(overlappingLeave.endDate).toLocaleDateString()}).`
        });
    }

    const leave = await Leave.create({
        user: req.user._id,
        leaveType,
        reason,
        startDate: start,
        endDate: end,
        leaveDuration: duration
    });

    res.status(201).json(leave);
};

// @desc    Get user's leaves
// @route   GET /leaves/list/:userId
// @access  Private
const getUserLeaves = async (req, res) => {
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.userId) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    const leaves = await Leave.find({ user: req.params.userId });
    res.json(leaves);
};

// @desc    Get all pending leaves
// @route   GET /leaves/pending
// @access  Private (Admin/Sub-Admin)
const getPendingLeaves = async (req, res) => {
    const leaves = await Leave.find({ status: 'pending' }).populate('user', 'name email');
    res.json(leaves);
};

// @desc    Get all leaves (filtering supported)
// @route   GET /leaves/all
// @access  Private (Admin/Sub-Admin)
const getAllLeaves = async (req, res) => {
    const { status, search } = req.query;

    let query = {};

    // Status Filter
    if (status && status !== 'All') {
        query.status = status.toLowerCase();
    }

    // Search Filter (for reason)
    if (search) {
        query.reason = { $regex: search, $options: 'i' };
    }

    const leaves = await Leave.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

    res.json(leaves);
};

const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');

// @desc    Approve leave
// @route   POST /leaves/approve/:id
// @access  Private (Admin/Sub-Admin)
const approveLeave = async (req, res) => {
    const leave = await Leave.findById(req.params.id);

    if (leave) {
        leave.status = 'approved';
        leave.approvedBy = req.user._id;
        await leave.save();

        // Mark attendance logic
        const settings = await Settings.findOne() || {};
        const leavePolicy = settings.leavePolicy || { casualLeave: 12, sickLeave: 10, annualLeave: 18 };
        const weekendPolicy = settings.weekendPolicy || ['Sat', 'Sun'];

        // Map leave type to policy field
        const typeMap = {
            'Casual': 'casualLeave',
            'Sick': 'sickLeave',
            'Annual': 'annualLeave',
            'Maternity': 'maternityLeave'
        };
        const policyField = typeMap[leave.leaveType] || 'casualLeave';
        const quota = leavePolicy[policyField] || 12;

        // Calculate used leaves for this type in current year
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31);

        const attendanceLogs = await Attendance.find({
            user: leave.user,
            status: { $in: ['leave', 'unpaid_leave'] },
            date: { $gte: startOfYear, $lte: endOfYear }
        });

        const totalUsedDuration = attendanceLogs.reduce((sum, log) => sum + (log.leaveDuration || 1), 0);

        let currentUsed = totalUsedDuration;
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[d.getDay()];

            if (weekendPolicy.includes(dayName)) continue; // Skip weekends

            const durationNeeded = leave.leaveDuration || 1;
            let status = 'leave';

            if (currentUsed + durationNeeded > quota) {
                status = 'unpaid_leave';
            } else {
                currentUsed += durationNeeded;
            }

            // Create or Update attendance for this day
            const dateOnly = new Date(d);
            dateOnly.setHours(0, 0, 0, 0);

            await Attendance.findOneAndUpdate(
                { user: leave.user, date: dateOnly },
                {
                    status: status,
                    leaveType: leave.leaveType,
                    leaveDuration: durationNeeded
                },
                { upsert: true, new: true }
            );
        }

        res.json(leave);
    } else {
        res.status(404).json({ message: 'Leave request not found' });
    }
};

// @desc    Reject leave
// @route   POST /leaves/reject/:id
// @access  Private (Admin/Sub-Admin)
const rejectLeave = async (req, res) => {
    const leave = await Leave.findById(req.params.id);

    if (leave) {
        leave.status = 'rejected';
        leave.approvedBy = req.user._id;
        await leave.save();
        res.json(leave);
    } else {
        res.status(404).json({ message: 'Leave request not found' });
    }
};

module.exports = {
    applyLeave,
    getUserLeaves,
    getPendingLeaves,
    getAllLeaves,
    approveLeave,
    rejectLeave
};
