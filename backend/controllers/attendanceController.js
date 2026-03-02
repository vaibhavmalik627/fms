const Attendance = require('../models/Attendance');
const Faculty = require('../models/Faculty');

exports.markAttendance = async (req, res, next) => {
  try {
    const { facultyId, date, status } = req.body;
    if (!facultyId || !date || !status) {
      return res.status(400).json({ message: 'facultyId, date, and status are required' });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const normalizedDate = startOfDay(date);
    const record = await Attendance.findOneAndUpdate(
      { facultyId, date: normalizedDate },
      {
        facultyId,
        date: normalizedDate,
        status,
        markedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const { facultyId, month, status } = req.query;
    const query = {};

    if (req.user.role === 'Teacher') {
      query.facultyId = req.user._id;
    } else if (facultyId) {
      query.facultyId = facultyId;
    }

    if (status) {
      query.status = status;
    }

    if (month) {
      const [start, end] = monthRange(month);
      query.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(query)
      .populate('facultyId', 'name email department subject')
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    next(err);
  }
};

exports.getMonthlySummary = async (req, res, next) => {
  try {
    const { facultyId, month } = req.query;
    if (!month) {
      return res.status(400).json({ message: 'month is required in YYYY-MM format' });
    }

    const effectiveFacultyId = req.user.role === 'Teacher' ? req.user._id.toString() : facultyId;
    if (!effectiveFacultyId) {
      return res.status(400).json({ message: 'facultyId is required' });
    }

    const [start, end] = monthRange(month);
    const records = await Attendance.find({
      facultyId: effectiveFacultyId,
      date: { $gte: start, $lt: end },
    });

    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const leave = records.filter((r) => r.status === 'Leave').length;
    const total = records.length;
    const attendancePercent = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

    res.json({
      facultyId: effectiveFacultyId,
      month,
      present,
      absent,
      leave,
      totalMarkedDays: total,
      attendancePercent,
    });
  } catch (err) {
    next(err);
  }
};

function startOfDay(dateInput) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}

function monthRange(month) {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  return [start, end];
}
