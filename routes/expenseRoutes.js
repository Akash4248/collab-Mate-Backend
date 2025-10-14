const express = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middleware/authMiddleware');
const { createExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');

const router = express.Router();

// Create expense under project
router.post(
  '/project/:projectId',
  auth,
  [param('projectId').isMongoId(), body('title').notEmpty(), body('amount').isFloat({ gt: 0 })],
  createExpense
);

// Get expenses for a project
router.get('/project/:projectId', auth, [param('projectId').isMongoId()], getExpenses);

// Update expense
router.put('/:id', auth, [param('id').isMongoId()], updateExpense);

// Delete expense
router.delete('/:id', auth, [param('id').isMongoId()], deleteExpense);

module.exports = router;


