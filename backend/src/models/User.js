const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'sub-admin', 'employee'],
        default: 'employee'
    },
    designation: {
        type: String
    },
    salary: {
        type: Number,
        default: 0
    },
    salaryType: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on_leave', 'terminated', 'blocked'],
        default: 'active'
    },
    image: {
        type: String // URL
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    phone: {
        type: String
    },
    location: {
        type: String
    },
    workMode: {
        type: String,
        enum: ['WFH', 'WFO'],
        default: 'WFO'
    },
    joiningDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to check entered password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password pre-save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
