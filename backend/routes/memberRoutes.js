const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const verifyToken = require('../middleware/auth');

// Apply authentication middleware to all member routes
router.use(verifyToken);

router.get('/', memberController.getMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.patch('/:id/status', memberController.updateMemberStatus);

module.exports = router;