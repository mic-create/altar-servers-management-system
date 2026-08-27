// FILE: backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middleware/auth');

if (typeof verifyToken === 'function') {
  router.use(verifyToken);
}

router.get('/', reportController.getSystemReports);

module.exports = router;