const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Project = require('../models/Project');
const Salary = require('../models/Salary');

// @desc    Get comprehensive overview for a specific employee
// @route   GET /auth/user-overview/:userId
// @access  Private (Admin/Sub-Admin)
const getEmployeeOverview = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-indexed

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Attendance Stats (Current Month)
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        const attendanceLogs = await Attendance.find({
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const attendanceStats = {
            present: attendanceLogs.filter(l => l.status === 'present' || l.status === 'late').length,
            absent: attendanceLogs.filter(l => l.status === 'absent').length,
            late: attendanceLogs.filter(l => l.status === 'late').length,
            leave: attendanceLogs.filter(l => l.status === 'leave').length,
            holiday: attendanceLogs.filter(l => l.status === 'holiday').length,
            weekend: attendanceLogs.filter(l => l.status === 'weekend').length
        };

        // 2. Leave Breakdown (Current Year)
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        const approvedLeaves = await Leave.find({
            user: userId,
            status: 'approved',
            startDate: { $gte: startOfYear, $lte: endOfYear }
        });

        const leaveBreakdown = approvedLeaves.reduce((acc, leave) => {
            const type = leave.leaveType || 'Other';
            acc[type] = (acc[type] || 0) + (leave.leaveDuration || 1);
            return acc;
        }, {});

        // 3. Projects list
        const projects = await Project.find({ assignedTo: userId }).select('name status progress deadline');

        // 4. Recent Salary
        const recentSalary = await Salary.findOne({ user: userId }).sort({ createdAt: -1 });

        res.json({
            profile: user,
            attendanceStats,
            leaveBreakdown,
            projects,
            recentSalary
        });
    } catch (error) {
        console.error('Error in getEmployeeOverview:', error);
        res.status(500).json({ message: 'Server error fetching employee overview' });
    }
};

module.exports = { getEmployeeOverview };
