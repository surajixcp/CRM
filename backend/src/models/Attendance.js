const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    },
    workingHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'leave', 'unpaid_leave', 'weekend', 'holiday'],
        default: 'absent'
    },
    leaveType: {
        type: String
    },
    overtimeHours: {
        type: Number,
        default: 0
    },
    leaveDuration: {
        type: Number,
        default: 0 // 1 for full day, 0.5 for half day
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
