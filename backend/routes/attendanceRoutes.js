const express = require('express');
const router = express.Router();
const {
  punchIn,
  punchOut,
  getAttendance,
  getMonthlySummary,
  getTodayStatus,
} = require('../controllers/attendanceController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/punch-in', authMiddleware, authorizeRoles('Teacher'), punchIn);
router.post('/punch-out', authMiddleware, authorizeRoles('Teacher'), punchOut);
router.get('/', authMiddleware, getAttendance);
router.get('/summary', authMiddleware, getMonthlySummary);
router.get('/today-status', authMiddleware, getTodayStatus);

module.exports = router;
