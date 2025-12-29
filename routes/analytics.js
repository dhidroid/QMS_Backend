const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controller/analytics/analyticsController');
const { auth } = require('../middlewares/authMiddleware');

router.get('/', auth('admin'), getAnalytics);

module.exports = router;
