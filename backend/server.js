// FILE: server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Define allowed origins for production and local development
const allowedOrigins = [
  'https://sfccaltarservers.vercel.app',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

// CORS configuration supporting credentials (cookies / authorization headers)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (like Postman or server-to-server) with no origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Register CORS middleware FIRST so OPTIONS preflight requests are handled correctly before routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicitly handle preflight for all routes

app.use(express.json());
app.use(cookieParser());

// Import your existing routes (adjust path names if your structure differs slightly)
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const meetingRoutes = require('./routes/meetings');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Altar Servers Management System API is running.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});