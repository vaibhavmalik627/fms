const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    classroom: { type: String, required: true, trim: true, index: true },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
      index: true,
    },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timetableSchema.index({ facultyId: 1, dayOfWeek: 1, startTime: 1 });
timetableSchema.index({ classroom: 1, dayOfWeek: 1, startTime: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
