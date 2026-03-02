const express = require('express');
const router = express.Router();
const { register, login, teacherLogin, teacherChangePassword } = require('../controllers/authController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/teacher-login', teacherLogin);
router.post('/teacher-change-password', authMiddleware, authorizeRoles('Teacher'), teacherChangePassword);

module.exports = router;
