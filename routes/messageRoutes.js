const express = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middleware/authMiddleware');
const { createMessage, getMessages } = require('../controllers/messageController');

const router = express.Router();

// Create a message for a project
router.post(
  '/project/:projectId',
  auth,
  [param('projectId').isMongoId(), body('content').notEmpty()],
  createMessage
);

// Get messages for a project
router.get('/project/:projectId', auth, [param('projectId').isMongoId()], getMessages);

module.exports = router;


