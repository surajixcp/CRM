require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const projectRoutes = require('./routes/projectRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const settingRoutes = require('./routes/settingRoutes');
const reportRoutes = require('./routes/reportRoutes');

const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes); // Mounted
app.use('/attendance', attendanceRoutes);
app.use('/leaves', leaveRoutes);
app.use('/projects', projectRoutes);
app.use('/meetings', meetingRoutes);
app.use('/holidays', holidayRoutes);
app.use('/salaries', salaryRoutes);
app.use('/settings', settingRoutes);
app.use('/reports', reportRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running...' });
});

// Favicon fix
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
