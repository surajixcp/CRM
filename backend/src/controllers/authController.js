const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    console.log('Generating token for ID:', id);
    console.log('Using JWT_SECRET length (sign):', process.env.JWT_SECRET?.length);
    console.log('JWT_SECRET starts with (sign):', process.env.JWT_SECRET?.substring(0, 3));
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.status === 'blocked') {
            res.status(401).json({ message: 'Your account has been blocked. Please contact admin.' });
            return;
        }

        if (user.status !== 'active' && user.status !== 'on_leave') {
            res.status(401).json({ message: 'Account is inactive. Please contact admin.' });
            return;
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            joiningDate: user.joiningDate,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new admin (Initial setup)
// @route   POST /auth/register-admin
// @access  Public
const registerAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
        role: 'admin'
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            joiningDate: user.joiningDate,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Create a new employee
// @route   POST /auth/create-employee
// @access  Admin/Sub-Admin
const createEmployee = async (req, res) => {
    try {
        const { name, email, password, designation, salary, salaryType, role, status, phone, location, workMode, joiningDate } = req.body;

        // Map frontend role categories to backend authorized roles
        const validRoles = ['admin', 'sub-admin', 'employee'];
        const dbRole = validRoles.includes(role?.toLowerCase()) ? role.toLowerCase() : 'employee';

        // Safety check for req.user (should be caught by protect middleware, but double check)
        if (!req.user || !req.user._id) {
            res.status(401).json({ message: 'User not authenticated or invalid token' });
            return;
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = await User.create({
            name,
            email,
            password,
            role: dbRole,
            designation,
            salary,
            salaryType: (salaryType === 'annual' || salaryType === 'monthly') ? salaryType : 'monthly',
            status: (status?.toLowerCase() === 'active' || status?.toLowerCase() === 'on_leave' || status?.toLowerCase() === 'terminated' || status?.toLowerCase() === 'inactive' || status?.toLowerCase() === 'blocked') ? status.toLowerCase() : 'active',
            phone,
            location,
            workMode: (workMode === 'WFH' || workMode === 'WFO') ? workMode : 'WFO',
            joiningDate: joiningDate || Date.now(),
            createdBy: req.user._id
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                designation: user.designation,
                salary: user.salary,
                salaryType: user.salaryType,
                phone: user.phone,
                location: user.location,
                workMode: user.workMode,
                joiningDate: user.joiningDate
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Create Employee Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new sub-admin
// @route   POST /auth/create-subadmin
// @access  Admin
const createSubAdmin = async (req, res) => {
    const { name, email, password, designation } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
        role: 'sub-admin',
        designation,
        createdBy: req.user._id
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get user profile
// @route   GET /auth/me
// @access  Private
const getMe = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            designation: user.designation,
            salary: user.salary,
            salaryType: user.salaryType,
            image: user.image,
            phone: user.phone,
            location: user.location,
            workMode: user.workMode,
            joiningDate: user.joiningDate
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all users (with optional role filter)
// @route   GET /auth/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        // If role is 'All' or undefined, show all. If specific role, filter.
        const filter = (role && role !== 'All') ? { role } : {};

        const users = await User.find(filter).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /auth/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // Sanitize role update
        const validRoles = ['admin', 'sub-admin', 'employee'];
        if (req.body.role && validRoles.includes(req.body.role.toLowerCase())) {
            user.role = req.body.role.toLowerCase();
        }

        user.designation = req.body.designation || user.designation;
        user.status = req.body.status?.toLowerCase() || user.status;
        user.salary = req.body.salary || user.salary;
        user.salaryType = (req.body.salaryType === 'annual' || req.body.salaryType === 'monthly') ? req.body.salaryType : user.salaryType;
        user.image = req.body.image || user.image;
        user.phone = req.body.phone || user.phone;
        user.location = req.body.location || user.location;
        user.workMode = req.body.workMode || user.workMode;
        user.joiningDate = req.body.joiningDate || user.joiningDate;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            designation: updatedUser.designation,
            status: updatedUser.status,
            salary: updatedUser.salary,
            salaryType: updatedUser.salaryType,
            phone: updatedUser.phone,
            location: updatedUser.location,
            workMode: updatedUser.workMode,
            joiningDate: updatedUser.joiningDate
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Delete user
// @route   DELETE /auth/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        console.log('updateProfile called with body:', req.body);
        console.log('User ID from token:', req.user?._id);

        const user = await User.findById(req.user._id);

        if (!user) {
            console.log('User not found for ID:', req.user._id);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Current user data:', {
            name: user.name,
            email: user.email,
            image: user.image
        });

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.location = req.body.location || user.location;
        user.image = req.body.image || user.image;
        user.workMode = req.body.workMode || user.workMode;

        if (req.body.password) {
            user.password = req.body.password;
        }

        console.log('Saving user with updated data:', {
            name: user.name,
            email: user.email,
            image: user.image
        });

        const updatedUser = await user.save();

        console.log('User saved successfully:', updatedUser._id);

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            location: updatedUser.location,
            workMode: updatedUser.workMode,
            image: updatedUser.image,
            joiningDate: updatedUser.joiningDate,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ message: error.message || 'Failed to update profile' });
    }
};

module.exports = {
    loginUser,
    registerAdmin,
    createEmployee,
    createSubAdmin,
    getMe,
    getUsers, // Exported
    updateUser, // Exported
    deleteUser, // Exported
    updateProfile
};
