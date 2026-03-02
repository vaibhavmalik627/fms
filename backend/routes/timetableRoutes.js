const express = require('express');
const router = express.Router();
const {
  createTimetableSlot,
  getTimetable,
  updateTimetableSlot,
  deleteTimetableSlot,
} = require('../controllers/timetableController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getTimetable);
router.post('/', authMiddleware, authorizeRoles('Admin'), createTimetableSlot);
router.put('/:id', authMiddleware, authorizeRoles('Admin'), updateTimetableSlot);
router.delete('/:id', authMiddleware, authorizeRoles('Admin'), deleteTimetableSlot);

module.exports = router;
