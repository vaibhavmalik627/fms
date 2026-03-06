const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const User = require('../models/User');

const SUBJECTS = [
  'Computer Networks',
  'DBMS',
  'Operating Systems',
  'Data Structures',
  'Software Engineering',
  'Artificial Intelligence',
  'Web Development',
];

const CLASSROOMS = ['C-101', 'C-102', 'C-103', 'C-104', 'C-105', 'C-106', 'C-107'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FACULTY_SEED = [
  {
    name: 'Meena Sharma',
    subject: 'Computer Networks',
    department: 'CSE',
    email: 'meena.sharma@fms.local',
    phone: '8302678073',
    qualification: 'M.Tech',
    experience: 6,
    image: 'https://i.pravatar.cc/300?img=5',
  },
  {
    name: 'Rohit Verma',
    subject: 'DBMS',
    department: 'CSE',
    email: 'rohit.verma@fms.local',
    phone: '9876543210',
    qualification: 'M.Tech',
    experience: 8,
    image: 'https://i.pravatar.cc/300?img=12',
  },
  {
    name: 'Aditi Singh',
    subject: 'Operating Systems',
    department: 'CSE',
    email: 'aditi.singh@fms.local',
    phone: '9811122233',
    qualification: 'M.Tech',
    experience: 5,
    image: 'https://i.pravatar.cc/300?img=32',
  },
  {
    name: 'Karan Patel',
    subject: 'Data Structures',
    department: 'IT',
    email: 'karan.patel@fms.local',
    phone: '9898989898',
    qualification: 'M.E.',
    experience: 7,
    image: 'https://i.pravatar.cc/300?img=21',
  },
  {
    name: 'Neha Kapoor',
    subject: 'Software Engineering',
    department: 'IT',
    email: 'neha.kapoor@fms.local',
    phone: '9787612345',
    qualification: 'M.Tech',
    experience: 4,
    image: 'https://i.pravatar.cc/300?img=45',
  },
];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const adminEmail = String(process.env.ADMIN_EMAIL || '').toLowerCase();
  const admin = adminEmail ? await User.findOne({ email: adminEmail }) : null;
  const markedBy = admin?._id || undefined;

  const hashedTeacherPassword = await bcrypt.hash('teacher123', 10);

  const facultyDocs = [];
  for (const seed of FACULTY_SEED) {
    const doc = await Faculty.findOneAndUpdate(
      { email: seed.email },
      {
        name: seed.name,
        subject: seed.subject,
        department: seed.department,
        email: seed.email,
        phone: seed.phone,
        qualification: seed.qualification,
        experience: seed.experience,
        joiningDate: new Date('2024-07-01'),
        status: 'Active',
        profileImage: seed.image,
        teacherPassword: hashedTeacherPassword,
        mustResetPassword: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    facultyDocs.push(doc);
  }

  await Timetable.deleteMany({ facultyId: { $in: facultyDocs.map((f) => f._id) } });
  const timetableEntries = buildTimetable(facultyDocs);
  if (timetableEntries.length) {
    await Timetable.insertMany(
      timetableEntries.map((row) => ({
        ...row,
        assignedBy: markedBy,
      }))
    );
  }

  const weekDates = getCurrentWeekDates();
  for (const [facultyIndex, faculty] of facultyDocs.entries()) {
    for (const [dayIndex, dayDate] of weekDates.entries()) {
      const state = getDailyState(facultyIndex, dayIndex);
      const update = {
        facultyId: faculty._id,
        date: dayDate,
        status: state.status,
        markedBy,
      };

      if (state.status === 'Present') {
        update.punchInAt = withTime(dayDate, state.inHour, state.inMinute);
        update.punchOutAt = withTime(dayDate, state.outHour, state.outMinute);
      } else {
        update.punchInAt = null;
        update.punchOutAt = null;
      }

      await Attendance.findOneAndUpdate(
        { facultyId: faculty._id, date: dayDate },
        update,
        { upsert: true, new: true, runValidators: true }
      );
    }
  }

  console.log('Seed complete:');
  console.log(`- Faculty: ${facultyDocs.length}`);
  console.log(`- Subjects presets: ${SUBJECTS.join(', ')}`);
  console.log(`- Classroom presets: ${CLASSROOMS.join(', ')}`);
  console.log(`- Timetable slots: ${timetableEntries.length}`);
  console.log(`- Attendance entries: ${facultyDocs.length * weekDates.length}`);
  console.log('- Teacher demo password: teacher123');
}

function buildTimetable(facultyDocs) {
  const startTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'];
  const entries = [];

  for (const [fIndex, faculty] of facultyDocs.entries()) {
    for (let i = 0; i < DAYS.length; i += 1) {
      const firstSlot = startTimes[(fIndex + i) % startTimes.length];
      const secondSlot = startTimes[(fIndex + i + 2) % startTimes.length];
      const firstClass = CLASSROOMS[(fIndex + i) % CLASSROOMS.length];
      const secondClass = CLASSROOMS[(fIndex + i + 3) % CLASSROOMS.length];

      entries.push({
        facultyId: faculty._id,
        subject: faculty.subject,
        classroom: firstClass,
        dayOfWeek: DAYS[i],
        startTime: firstSlot,
        endTime: addOneHour(firstSlot),
      });

      entries.push({
        facultyId: faculty._id,
        subject: SUBJECTS[(fIndex + i) % SUBJECTS.length],
        classroom: secondClass,
        dayOfWeek: DAYS[i],
        startTime: secondSlot,
        endTime: addOneHour(secondSlot),
      });
    }
  }
  return entries;
}

function addOneHour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const next = h + 1;
  return `${String(next).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getCurrentWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

function getDailyState(facultyIndex, dayIndex) {
  if ((facultyIndex + dayIndex) % 9 === 0) {
    return { status: 'Leave' };
  }
  if ((facultyIndex + dayIndex) % 5 === 0) {
    return { status: 'Absent' };
  }
  return {
    status: 'Present',
    inHour: 8 + ((facultyIndex + dayIndex) % 2),
    inMinute: 55 + (dayIndex % 5),
    outHour: 15 + ((facultyIndex + dayIndex) % 2),
    outMinute: 20 + (facultyIndex % 10),
  };
}

function withTime(baseDate, hour, minute) {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
