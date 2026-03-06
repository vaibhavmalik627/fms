const Attendance = require('../models/Attendance');
const Faculty = require('../models/Faculty');
const LeaveRequest = require('../models/LeaveRequest');

exports.createLeaveRequest = async (req, res, next) => {
  try {
    const { facultyId, fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({ message: 'fromDate, toDate, and reason are required' });
    }

    let effectiveFacultyId = facultyId;
    if (req.user.role === 'Teacher') {
      effectiveFacultyId = req.user._id;
    }

    if (!effectiveFacultyId) {
      return res.status(400).json({ message: 'facultyId is required' });
    }

    const faculty = await Faculty.findById(effectiveFacultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const start = normalizeDate(fromDate);
    const end = normalizeDate(toDate);
    if (end < start) {
      return res.status(400).json({ message: 'toDate must be greater than or equal to fromDate' });
    }

    const leaveRequest = await LeaveRequest.create({
      facultyId: effectiveFacultyId,
      fromDate: start,
      toDate: end,
      reason,
    });

    res.status(201).json(leaveRequest);
  } catch (err) {
    next(err);
  }
};

exports.getLeaveRequests = async (req, res, next) => {
  try {
    const { status, facultyId } = req.query;
    const query = {};

    if (req.user.role === 'Teacher') {
      query.facultyId = req.user._id;
    } else if (facultyId) {
      query.facultyId = facultyId;
    }

    if (status) query.status = status;

    const rows = await LeaveRequest.find(query)
      .populate('facultyId', 'name email department subject')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, reviewNote = '' } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be Approved or Rejected' });
    }

    const request = await LeaveRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    request.status = status;
    request.reviewNote = reviewNote;
    request.reviewedBy = req.user._id;
    await request.save();

    if (status === 'Approved') {
      const entries = datesBetween(request.fromDate, request.toDate).map((day) => ({
        updateOne: {
          filter: { facultyId: request.facultyId, date: day },
          update: {
            facultyId: request.facultyId,
            date: day,
            status: 'Leave',
            punchInAt: null,
            punchOutAt: null,
            markedBy: req.user._id,
          },
          upsert: true,
        },
      }));

      if (entries.length) {
        await Attendance.bulkWrite(entries);
      }
    }

    const populated = await LeaveRequest.findById(request._id)
      .populate('facultyId', 'name email department subject')
      .populate('reviewedBy', 'name email role');
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

function normalizeDate(dateInput) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}

function datesBetween(startDate, endDate) {
  const dates = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
