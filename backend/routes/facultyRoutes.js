const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createFaculty,
  getFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  resetTeacherPassword,
} = require('../controllers/facultyController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

// Multer config
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Routes
router.post('/', authMiddleware, authorizeRoles('Admin'), upload.single('profileImage'), createFaculty);
router.get('/', authMiddleware, getFaculty);
router.get('/:id', authMiddleware, getFacultyById);
router.put('/:id', authMiddleware, authorizeRoles('Admin'), upload.single('profileImage'), updateFaculty);
router.delete('/:id', authMiddleware, authorizeRoles('Admin'), deleteFaculty);
router.put('/:id/reset-password', authMiddleware, authorizeRoles('Admin'), resetTeacherPassword);

module.exports = router;
