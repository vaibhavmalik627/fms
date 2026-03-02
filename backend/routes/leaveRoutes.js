const express = require('express');
const router = express.Router();
const {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, authorizeRoles('Teacher', 'Admin'), createLeaveRequest);
router.get('/', authMiddleware, authorizeRoles('Teacher', 'Admin'), getLeaveRequests);
router.put('/:id/status', authMiddleware, authorizeRoles('Admin'), updateLeaveStatus);

module.exports = router;
