// FILE: backend/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
path = require('path');

const app = express();

// Define allowed origins for production and local development
const allowedOrigins = [
  'https://sfccaltarservers.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Import application routes
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const meetingRoutes = require('./routes/meetings');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'SFCC Altar Servers API Service is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});