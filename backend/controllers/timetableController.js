const Faculty = require('../models/Faculty');
const Timetable = require('../models/Timetable');

exports.createTimetableSlot = async (req, res, next) => {
  try {
    const { facultyId, subject, classroom, dayOfWeek, startTime, endTime } = req.body;
    if (!facultyId || !subject || !classroom || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ message: 'All timetable fields are required' });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    validateTimeRange(startTime, endTime);
    await assertNoConflicts({ facultyId, classroom, dayOfWeek, startTime, endTime });

    const slot = await Timetable.create({
      facultyId,
      subject,
      classroom,
      dayOfWeek,
      startTime,
      endTime,
      assignedBy: req.user._id,
    });

    const populated = await Timetable.findById(slot._id).populate('facultyId', 'name email department subject');
    res.status(201).json(populated);
  } catch (err) {
    if (isClientError(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const { facultyId, dayOfWeek, classroom } = req.query;
    const query = {};

    if (req.user.role === 'Teacher') {
      query.facultyId = req.user._id;
    } else if (facultyId) {
      query.facultyId = facultyId;
    }

    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (classroom) query.classroom = classroom;

    const rows = await Timetable.find(query)
      .populate('facultyId', 'name email department subject')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.updateTimetableSlot = async (req, res, next) => {
  try {
    const slot = await Timetable.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Timetable slot not found' });
    }

    const updated = {
      facultyId: req.body.facultyId || slot.facultyId.toString(),
      subject: req.body.subject || slot.subject,
      classroom: req.body.classroom || slot.classroom,
      dayOfWeek: req.body.dayOfWeek || slot.dayOfWeek,
      startTime: req.body.startTime || slot.startTime,
      endTime: req.body.endTime || slot.endTime,
    };

    validateTimeRange(updated.startTime, updated.endTime);
    await assertNoConflicts({ ...updated, excludeId: slot._id.toString() });

    Object.assign(slot, updated);
    await slot.save();

    const populated = await Timetable.findById(slot._id).populate('facultyId', 'name email department subject');
    res.json(populated);
  } catch (err) {
    if (isClientError(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

exports.deleteTimetableSlot = async (req, res, next) => {
  try {
    const slot = await Timetable.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Timetable slot not found' });
    }
    res.json({ message: 'Timetable slot deleted' });
  } catch (err) {
    next(err);
  }
};

async function assertNoConflicts({ facultyId, classroom, dayOfWeek, startTime, endTime, excludeId }) {
  const sameDaySlots = await Timetable.find({
    dayOfWeek,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: [{ facultyId }, { classroom }],
  });

  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  for (const existing of sameDaySlots) {
    const existingStart = toMinutes(existing.startTime);
    const existingEnd = toMinutes(existing.endTime);
    const overlap = newStart < existingEnd && newEnd > existingStart;
    if (!overlap) continue;

    const isFacultyConflict = existing.facultyId.toString() === String(facultyId);
    if (isFacultyConflict) {
      throw new Error('Faculty is already assigned in this time range');
    }

    const isClassroomConflict = existing.classroom === classroom;
    if (isClassroomConflict) {
      throw new Error('Classroom is already occupied in this time range');
    }
  }
}

function toMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

function validateTimeRange(startTime, endTime) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error('Invalid time format. Use HH:mm');
  }
  if (start >= end) {
    throw new Error('endTime must be greater than startTime');
  }
}

function isClientError(message = '') {
  return (
    message.includes('already assigned') ||
    message.includes('already occupied') ||
    message.includes('Invalid time format') ||
    message.includes('endTime must be greater')
  );
}
