const express = require('express');
const router = express.Router();
const {
    loginUser,
    registerAdmin,
    createEmployee,
    createSubAdmin,
    getMe,
    getUsers,
    updateUser,
    deleteUser,
    updateProfile
} = require('../controllers/authController');
const { getEmployeeOverview } = require('../controllers/employeeOverviewController');
const { protect, admin, subAdmin } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/register-admin', registerAdmin);
router.post('/create-employee', protect, subAdmin, createEmployee);
router.post('/create-subadmin', protect, admin, createSubAdmin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/user-overview/:userId', protect, subAdmin, getEmployeeOverview);

// User Management Routes
router.get('/users', protect, subAdmin, getUsers);
router.put('/users/:id', protect, subAdmin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
