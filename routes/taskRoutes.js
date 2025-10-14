const express = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middleware/authMiddleware');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

// Create task under project
router.post(
  '/project/:projectId',
  auth,
  [param('projectId').isMongoId(), body('title').notEmpty().withMessage('Task title is required')],
  createTask
);

// Get tasks for a project
router.get('/project/:projectId', auth, [param('projectId').isMongoId()], getTasks);

// Update a task
router.put(
  '/:id',
  auth,
  [param('id').isMongoId(), body('status').optional().isIn(['todo', 'in_progress', 'done'])],
  updateTask
);

// Delete a task
router.delete('/:id', auth, [param('id').isMongoId()], deleteTask);

module.exports = router;


