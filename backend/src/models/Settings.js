const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'WorkStream Inc.'
    },
    adminEmail: {
        type: String,
    },
    companyLogo: {
        type: String // URL from Cloudinary
    },
    workingHours: {
        checkIn: { type: String, default: '09:00' },
        gracePeriod: { type: Number, default: 15 },
        checkOut: { type: String, default: '18:00' }
    },
    weekendPolicy: {
        type: [String], // Array of days, e.g., ['Sat', 'Sun']
        default: ['Sat', 'Sun']
    },
    leavePolicy: {
        casualLeave: { type: Number, default: 12 },
        sickLeave: { type: Number, default: 10 },
        annualLeave: { type: Number, default: 18 },
        maternityLeave: { type: Number, default: 12 },
        requireApproval: { type: Boolean, default: true },
        notifyStaff: { type: Boolean, default: true },
        enableHalfDay: { type: Boolean, default: false }
    },
    payroll: {
        monthlyBudget: { type: Number, default: 0 },
        salaryDate: { type: Number, default: 1 } // Day of the month (1-31)
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
