const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, deleteCompany } = require('../controllers/settingController');
const { protect, subAdmin } = require('../middlewares/authMiddleware');

router.get('/', protect, getSettings);
router.put('/', protect, subAdmin, updateSettings);
router.delete('/', protect, deleteCompany);

module.exports = router;
