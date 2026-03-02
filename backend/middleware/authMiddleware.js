const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.kind === 'teacher') {
      const faculty = await Faculty.findById(decoded.id).select('name email profileImage department subject mustResetPassword');
      if (!faculty) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      req.user = {
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        role: 'Teacher',
        profileImage: faculty.profileImage || null,
        department: faculty.department || '',
        subject: faculty.subject || '',
        mustResetPassword: Boolean(faculty.mustResetPassword),
      };
      return next();
    }

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { authMiddleware, authorizeRoles };
