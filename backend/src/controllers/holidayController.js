const Holiday = require('../models/Holiday');

// @desc    Create a new holiday
// @route   POST /holidays
// @access  Private (Admin/Sub-Admin)
const createHoliday = async (req, res) => {
    const { name, date, type } = req.body;

    const holiday = await Holiday.create({
        name,
        date,
        type
    });

    res.status(201).json(holiday);
};

// @desc    Get all holidays
// @route   GET /holidays
// @access  Private
const getHolidays = async (req, res) => {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.json(holidays);
};

// @desc    Update holiday
// @route   PUT /holidays/:id
// @access  Private (Admin)
const updateHoliday = async (req, res) => {
    const holiday = await Holiday.findById(req.params.id);

    if (holiday) {
        // Prevent editing past holidays
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hDate = new Date(holiday.date);
        hDate.setHours(0, 0, 0, 0);

        if (hDate < today) {
            return res.status(400).json({ message: 'Cannot edit past holidays.' });
        }

        holiday.name = req.body.name || holiday.name;
        holiday.date = req.body.date || holiday.date;
        holiday.type = req.body.type || holiday.type;

        const updatedHoliday = await holiday.save();
        res.json(updatedHoliday);
    } else {
        res.status(404).json({ message: 'Holiday not found' });
    }
};

// @desc    Delete holiday
// @route   DELETE /holidays/:id
// @access  Private (Admin)
const deleteHoliday = async (req, res) => {
    const holiday = await Holiday.findById(req.params.id);

    if (holiday) {
        // Prevent deleting past holidays
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hDate = new Date(holiday.date);
        hDate.setHours(0, 0, 0, 0);

        if (hDate < today) {
            return res.status(400).json({ message: 'Cannot delete past holidays.' });
        }

        await Holiday.deleteOne({ _id: holiday._id });
        res.json({ message: 'Holiday removed' });
    } else {
        res.status(404).json({ message: 'Holiday not found' });
    }
};

module.exports = {
    createHoliday,
    getHolidays,
    updateHoliday,
    deleteHoliday
};
