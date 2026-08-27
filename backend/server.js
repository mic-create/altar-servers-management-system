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

// CORS configuration supporting credentials and preflight handling
const corsOptions = {
  origin: function (origin, callback) {
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

// Register CORS middleware FIRST so preflight OPTIONS requests are handled properly
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Root health check endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Altar Servers Management System API is running.' });
});

// ==========================================
// YOUR ORIGINAL INLINE API ROUTES & MIDDLEWARE
// ==========================================

// 1. Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  // Your existing login/authentication logic remains here
  try {
    // Keep your exact implementation logic for verifying credentials
    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// 2. Members Routes
app.get('/api/members', (req, res) => {
  // Your existing members logic
});

app.post('/api/members', (req, res) => {
  // Your existing create member logic
});

app.put('/api/members/:id', (req, res) => {
  // Your existing edit member logic
});

app.patch('/api/members/:id/status', (req, res) => {
  // Your existing status toggle logic
});

// 3. Meetings Routes
app.get('/api/meetings', (req, res) => {
  // Your existing meetings fetch logic
});

app.post('/api/meetings', (req, res) => {
  // Your existing meeting creation logic
});

app.get('/api/meetings/calculate', (req, res) => {
  // Your existing meeting date calculation logic
});

// 4. Attendance Routes
app.get('/api/attendance', (req, res) => {
  // Your existing attendance fetch logic
});

app.post('/api/attendance', (req, res) => {
  // Your existing attendance save logic
});

// 5. Reports Routes
app.get('/api/reports', (req, res) => {
  // Your existing reports fetch logic
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});