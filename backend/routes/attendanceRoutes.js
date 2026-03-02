const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendance,
  getMonthlySummary,
} = require('../controllers/attendanceController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/mark', authMiddleware, authorizeRoles('Admin'), markAttendance);
router.get('/', authMiddleware, getAttendance);
router.get('/summary', authMiddleware, getMonthlySummary);

module.exports = router;
