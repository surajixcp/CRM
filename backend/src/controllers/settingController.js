const Settings = require('../models/Settings');

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
        payroll
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

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } else {
        const newSettings = await Settings.create(req.body);
        res.status(201).json(newSettings);
    }
};

module.exports = {
    getSettings,
    updateSettings
};
