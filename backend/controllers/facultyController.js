const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { isCloudinaryEnabled, uploadImageBuffer, deleteCloudinaryAssetByUrl } = require('../utils/cloudinary');

// Create Faculty (Admin only)
exports.createFaculty = async (req, res, next) => {
  try {
    const { name, subject, department, email, phone, qualification, experience, joiningDate, status, teacherPassword } = req.body;
    const profileImage = await resolveProfileImage(req.file);
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
    const existing = await Faculty.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Faculty not found' });

    const updates = { ...req.body };
    if (req.file) updates.profileImage = await resolveProfileImage(req.file);

    if (updates.teacherPassword) {
      if (String(updates.teacherPassword).length < 8) {
        return res.status(400).json({ message: 'teacherPassword must be at least 8 characters' });
      }
      updates.teacherPassword = await bcrypt.hash(updates.teacherPassword, 10);
      updates.mustResetPassword = true;
    }

    const oldProfileImage = existing.profileImage;
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (updates.profileImage && oldProfileImage && oldProfileImage !== updates.profileImage) {
      await cleanupProfileImage(oldProfileImage);
    }

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
    await cleanupProfileImage(faculty.profileImage);
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

async function resolveProfileImage(file) {
  if (!file) return undefined;

  if (isCloudinaryEnabled()) {
    try {
      const uploaded = await uploadImageBuffer(file.buffer, file.originalname);
      return uploaded.secure_url;
    } catch (err) {
      if (!shouldFallbackToLocalUpload(err)) {
        throw err;
      }

      // Cloudinary DNS/network failures should not block faculty creation.
      return saveLocalProfileImage(file);
    }
  }

  if (file.filename) return file.filename;
  return saveLocalProfileImage(file);
}

async function cleanupProfileImage(profileImage) {
  if (!profileImage) return;

  if (/^https?:\/\//i.test(profileImage)) {
    await deleteCloudinaryAssetByUrl(profileImage);
    return;
  }

  const uploadPath = path.join(__dirname, '../uploads', profileImage);
  if (!fs.existsSync(uploadPath)) return;

  try {
    fs.unlinkSync(uploadPath);
  } catch (err) {
    // Best-effort cleanup; ignore delete failures.
  }
}

function shouldFallbackToLocalUpload(err) {
  if (!err) return false;

  const networkCodes = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT']);
  if (networkCodes.has(err.code)) return true;

  const message = String(err.message || '').toLowerCase();
  return message.includes('getaddrinfo') || message.includes('network');
}

function saveLocalProfileImage(file) {
  if (!file || !file.buffer) {
    throw new Error('Unable to save profile image locally: missing file buffer');
  }

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const localPath = path.join(uploadsDir, filename);
  fs.writeFileSync(localPath, file.buffer);

  return filename;
}
