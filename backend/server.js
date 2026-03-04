// Entry point for the backend server
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

validateEnv();

const app = express();
app.set('trust proxy', 1);

const envOrigins = [
  ...(process.env.CLIENT_ORIGINS ? process.env.CLIENT_ORIGINS.split(',') : []),
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...new Set(['http://localhost:5173', 'http://localhost:5174', ...envOrigins]),
];

// Middleware
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhostDevOrigin =
        /^http:\/\/localhost:\d+$/.test(origin || '') || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin || '');

      // Allow non-browser tools (Postman/curl) and allowed browser origins.
      if (!origin || allowedOrigins.includes(origin) || isLocalhostDevOrigin) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// Static folder for profile images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));

// Error Middleware
app.use(require('./middleware/errorMiddleware'));

// MongoDB Connection
const connectDB = require('./config/db');
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function validateEnv() {
  const required = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_NAME'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
