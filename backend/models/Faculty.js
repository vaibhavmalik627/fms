const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  qualification: { type: String },
  experience: { type: Number },
  joiningDate: { type: Date },
  status: { type: String, enum: ['Active', 'On Leave'], default: 'Active' },
  profileImage: { type: String },
  teacherPassword: { type: String, select: false },
  mustResetPassword: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
