// FILE: backend/routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const verifyToken = require('../middleware/auth');

// Guard all meeting routes with authentication middleware
if (typeof verifyToken === 'function') {
  router.use(verifyToken);
} else {
  console.error('CRITICAL: verifyToken middleware is undefined. Check backend/middleware/auth.js export.');
}

router.get('/', meetingController.getMeetings);
router.get('/calculate', meetingController.calculateLastSaturdayPreview);
router.get('/:id', meetingController.getMeetingById);
router.get('/:id/attendance', meetingController.getMeetingAttendance);
router.post('/', meetingController.createMeeting);
router.put('/:id/attendance', meetingController.saveAttendance);
router.post('/:id/attendance', meetingController.saveAttendance);
router.delete('/:id', meetingController.deleteMeeting);

module.exports = router;