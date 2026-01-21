const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Verifying token:', token.substring(0, 10) + '...');
            console.log('Using JWT_SECRET length:', process.env.JWT_SECRET?.length);
            console.log('JWT_SECRET starts with:', process.env.JWT_SECRET?.substring(0, 3));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error.name, error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, invalid token signature. Please log out and back in.' });
            }
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const subAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sub-admin')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as a sub-admin' });
    }
};

module.exports = { protect, admin, subAdmin };
