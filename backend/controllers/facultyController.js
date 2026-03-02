const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');

// Create Faculty (Admin only)
exports.createFaculty = async (req, res, next) => {
  try {
    const { name, subject, department, email, phone, qualification, experience, joiningDate, status, teacherPassword } = req.body;
    const profileImage = req.file ? req.file.filename : undefined;
    const payload = {
      name, subject, department, email, phone, qualification, experience, joiningDate, status, profileImage
    };

    if (teacherPassword) {
      if (String(teacherPassword).length < 8) {
        return res.status(400).json({ message: 'teacherPassword must be at least 8 characters' });
      }
      payload.teacherPassword = await bcrypt.hash(teacherPassword, 10);
      payload.mustResetPassword = true;
    }

    const faculty = await Faculty.create({
      ...payload,
    });
    res.status(201).json(faculty);
  } catch (err) {
    next(err);
  }
};

// Get all faculty (with pagination, search, filter)
exports.getFaculty = async (req, res, next) => {
  try {
    if (req.user.role === 'Teacher') {
      const ownRecord = await Faculty.findById(req.user._id);
      if (!ownRecord) {
        return res.status(404).json({ message: 'Faculty not found' });
      }
      return res.json({ total: 1, page: 1, limit: 1, faculty: [ownRecord] });
    }

    const { page = 1, limit = 10, search = '', department } = req.query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) {
      query.department = department;
    }
    const total = await Faculty.countDocuments(query);
    const faculty = await Faculty.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
    res.json({ total, page: pageNumber, limit: limitNumber, faculty });
  } catch (err) {
    next(err);
  }
};

// Get single faculty
exports.getFacultyById = async (req, res, next) => {
  try {
    if (req.user.role === 'Teacher' && String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    next(err);
  }
};

// Update faculty (Admin only)
exports.updateFaculty = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.profileImage = req.file.filename;

    if (updates.teacherPassword) {
      if (String(updates.teacherPassword).length < 8) {
        return res.status(400).json({ message: 'teacherPassword must be at least 8 characters' });
      }
      updates.teacherPassword = await bcrypt.hash(updates.teacherPassword, 10);
      updates.mustResetPassword = true;
    }

    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    next(err);
  }
};

// Delete faculty (Admin only)
exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json({ message: 'Faculty deleted' });
  } catch (err) {
    next(err);
  }
};

exports.resetTeacherPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: 'newPassword must be at least 8 characters' });
    }

    const faculty = await Faculty.findById(req.params.id).select('+teacherPassword');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    faculty.teacherPassword = await bcrypt.hash(newPassword, 10);
    faculty.mustResetPassword = true;
    await faculty.save();

    res.json({ message: 'Teacher password reset successfully', mustResetPassword: true });
  } catch (err) {
    next(err);
  }
};
