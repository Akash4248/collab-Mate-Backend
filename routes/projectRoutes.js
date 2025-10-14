const express = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middleware/authMiddleware');
const { createProject, getMyProjects, updateProject, deleteProject } = require('../controllers/projectController');

const router = express.Router();

// Create project
router.post(
  '/',
  auth,
  [body('name').notEmpty().withMessage('Project name is required')],
  createProject
);

// Get my projects
router.get('/', auth, getMyProjects);

// Update project
router.put(
  '/:id',
  auth,
  [param('id').isMongoId(), body('name').optional().notEmpty(), body('description').optional()],
  updateProject
);

// Delete project
router.delete('/:id', auth, [param('id').isMongoId()], deleteProject);

module.exports = router;


