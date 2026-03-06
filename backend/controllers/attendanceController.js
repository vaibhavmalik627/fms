const Attendance = require('../models/Attendance');
const Faculty = require('../models/Faculty');

exports.punchIn = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const normalizedDate = startOfDay(new Date());
    const now = new Date();

    const existing = await Attendance.findOne({ facultyId, date: normalizedDate });
    if (existing?.status === 'Leave') {
      return res.status(400).json({ message: 'Cannot punch in while on approved leave' });
    }
    if (existing?.punchInAt) {
      return res.status(400).json({ message: 'Already punched in for today' });
    }

    const record = await Attendance.findOneAndUpdate(
      { facultyId, date: normalizedDate },
      {
        facultyId,
        date: normalizedDate,
        status: 'Present',
        punchInAt: now,
        punchOutAt: null,
        markedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

exports.punchOut = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const normalizedDate = startOfDay(new Date());
    const now = new Date();

    const record = await Attendance.findOne({ facultyId, date: normalizedDate });
    if (!record || !record.punchInAt) {
      return res.status(400).json({ message: 'Punch in first before punch out' });
    }
    if (record.punchOutAt) {
      return res.status(400).json({ message: 'Already punched out for today' });
    }

    record.punchOutAt = now;
    await record.save();

    res.json(record);
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

exports.getTodayStatus = async (req, res, next) => {
  try {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const requestedFacultyId = String(req.query.facultyId || '').trim();

    if (req.user.role === 'Teacher') {
      const facultyId = req.user._id;
      const faculty = await Faculty.findById(facultyId).select('name email department subject');
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }

      const record = await Attendance.findOne({
        facultyId,
        date: { $gte: today, $lt: tomorrow },
      });

      return res.json({
        rows: [
          {
            facultyId,
            name: faculty.name,
            email: faculty.email || '',
            department: faculty.department || '',
            subject: faculty.subject || '',
            attendanceStatus: record?.status || 'Absent',
            isPresent: Boolean(record?.punchInAt),
            punchInAt: record?.punchInAt || null,
            punchOutAt: record?.punchOutAt || null,
            attendanceHours: calculateAttendanceHours(record?.punchInAt, record?.punchOutAt),
          },
        ],
      });
    }

    const facultyQuery = requestedFacultyId ? { _id: requestedFacultyId } : {};
    const faculties = await Faculty.find(facultyQuery).select('name email department subject').sort({ name: 1 });

    const facultyIds = faculties.map((f) => f._id);
    const records = await Attendance.find({
      facultyId: { $in: facultyIds },
      date: { $gte: today, $lt: tomorrow },
    });

    const byFacultyId = new Map(records.map((row) => [String(row.facultyId), row]));
    const rows = faculties.map((faculty) => {
      const record = byFacultyId.get(String(faculty._id));
      return {
        facultyId: faculty._id,
        name: faculty.name,
        email: faculty.email || '',
        department: faculty.department || '',
        subject: faculty.subject || '',
        attendanceStatus: record?.status || 'Absent',
        isPresent: Boolean(record?.punchInAt),
        punchInAt: record?.punchInAt || null,
        punchOutAt: record?.punchOutAt || null,
        attendanceHours: calculateAttendanceHours(record?.punchInAt, record?.punchOutAt),
      };
    });

    res.json({ rows });
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

function calculateAttendanceHours(punchInAt, punchOutAt) {
  if (!punchInAt || !punchOutAt) return 0;
  const start = new Date(punchInAt).getTime();
  const end = new Date(punchOutAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const hours = (end - start) / (1000 * 60 * 60);
  return Number(hours.toFixed(2));
}
