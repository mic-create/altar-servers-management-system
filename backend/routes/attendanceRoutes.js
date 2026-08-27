const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const verifyToken = require('../middleware/auth');

// All attendance API routes require administrator authentication
router.use(verifyToken);

router.get('/meetings/:meetingId/attendance', attendanceController.getMeetingAttendance);
router.post('/meetings/:meetingId/attendance', attendanceController.saveMeetingAttendance);

module.exports = router;