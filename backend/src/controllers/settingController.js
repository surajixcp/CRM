const Settings = require('../models/Settings');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Project = require('../models/Project');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const Meeting = require('../models/Meeting');
const Salary = require('../models/Salary');

// @desc    Get global settings
// @route   GET /settings
// @access  Private
const getSettings = async (req, res) => {
    let settings = await Settings.findOne();

    // If no settings exist, create one (default values from schema)
    if (!settings) {
        settings = await Settings.create({});
    }

    res.json(settings);
};

// @desc    Update global settings
// @route   PUT /settings
// @access  Private (Admin/Sub-Admin)
const updateSettings = async (req, res) => {
    const {
        companyName,
        adminEmail,
        companyLogo,
        workingHours,
        weekendPolicy,
        leavePolicy,
        payroll,
        officeLocation
    } = req.body;

    let settings = await Settings.findOne();

    if (settings) {
        settings.companyName = companyName || settings.companyName;
        settings.adminEmail = adminEmail || settings.adminEmail;
        if (companyLogo !== undefined) settings.companyLogo = companyLogo;
        if (workingHours) settings.workingHours = workingHours;
        if (weekendPolicy) settings.weekendPolicy = weekendPolicy;
        if (leavePolicy) settings.leavePolicy = leavePolicy;
        if (payroll) settings.payroll = payroll;
        if (officeLocation) settings.officeLocation = officeLocation;

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } else {
        const newSettings = await Settings.create(req.body);
        res.status(201).json(newSettings);
    }
};

// @desc    Delete entire company data
// @route   DELETE /settings
// @access  Private (Admin)
const deleteCompany = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const user = await User.findById(req.user._id);

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Only super-admins can perform this action' });
        }

        // Wipe all collections
        await Promise.all([
            User.deleteMany({}),
            Attendance.deleteMany({}),
            Project.deleteMany({}),
            Leave.deleteMany({}),
            Holiday.deleteMany({}),
            Meeting.deleteMany({}),
            Salary.deleteMany({}),
            Settings.deleteMany({})
        ]);

        res.json({ message: 'Whole company data vanished successfully. System reset.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    deleteCompany
};
