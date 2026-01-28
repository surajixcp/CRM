const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const seedAdmin = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_crm');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const email = 'boldvibetech@gmail.com';
        const password = 'dinesh123';
        const name = 'Dinesh Birla'; // Assuming name based on email

        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        // Create admin
        // Note: Password hashing is handled by pre-save hook in User model usually.
        // Let's rely on the model.

        const user = await User.create({
            name,
            email,
            password,
            role: 'admin',
            designation: 'Super Admin',
            status: 'active'
        });

        console.log(`Admin created: ${user.email} / ${password}`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
