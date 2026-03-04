const User = require('../models/User');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Vaibhav Malik';

// Register
exports.register = async (req, res, next) => {
  try {
    return res.status(403).json({
      message: 'Public registration is disabled. Use the configured admin credentials.',
    });
  } catch (err) {
    next(err);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (String(email || '').toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = await ensureFixedAdminUser();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role, 'user'),
    });
  } catch (err) {
    next(err);
  }
};

// Teacher login using email + password.
exports.teacherLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const faculty = await Faculty.findOne({
      email: { $regex: new RegExp(`^${escapeRegExp(email.trim())}$`, 'i') },
    }).select('+teacherPassword');

    if (!faculty) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!faculty.teacherPassword) {
      return res.status(400).json({ message: 'Password is not set. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, faculty.teacherPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      role: 'Teacher',
      profileImage: faculty.profileImage || null,
      department: faculty.department || '',
      subject: faculty.subject || '',
      mustResetPassword: Boolean(faculty.mustResetPassword),
      token: generateToken(faculty._id, 'Teacher', 'teacher'),
    });
  } catch (err) {
    next(err);
  }
};

exports.teacherChangePassword = async (req, res, next) => {
  try {
    if (req.user.role !== 'Teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'oldPassword and newPassword are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'newPassword must be at least 8 characters' });
    }

    const faculty = await Faculty.findById(req.user._id).select('+teacherPassword');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (!faculty.teacherPassword) {
      return res.status(400).json({ message: 'Password is not set. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, faculty.teacherPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    faculty.teacherPassword = await bcrypt.hash(newPassword, 10);
    faculty.mustResetPassword = false;
    await faculty.save();

    res.json({ message: 'Password updated successfully', mustResetPassword: false });
  } catch (err) {
    next(err);
  }
};

function generateToken(id, role, kind = 'user') {
  return jwt.sign({ id, role, kind }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureFixedAdminUser() {
  let user = await User.findOne({ email: ADMIN_EMAIL });

  if (!user) {
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'Admin',
    });
    return user;
  }

  const hasPassword = user.password
    ? await bcrypt.compare(ADMIN_PASSWORD, user.password)
    : false;
  const needsUpdate = user.role !== 'Admin' || !hasPassword || user.name !== ADMIN_NAME;

  if (needsUpdate) {
    user.name = ADMIN_NAME;
    user.role = 'Admin';
    user.password = ADMIN_PASSWORD;
    await user.save();
  }

  return user;
}
