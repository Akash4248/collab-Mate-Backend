const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Project = require('../models/Project');

// Verify user is a member of the project
async function ensureProjectMember(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isMember = project.members.some((m) => m.toString() === userId);
  return isMember ? project : null;
}

// Create an expense under a project
async function createExpense(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { projectId } = req.params;
    const { title, amount, notes } = req.body;
    const project = await ensureProjectMember(projectId, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const expense = await Expense.create({ project: projectId, title, amount, notes, paidBy: req.user.id });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

// Get expenses for a project
async function getExpenses(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await ensureProjectMember(projectId, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const expenses = await Expense.find({ project: projectId }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
}

// Update an expense
async function updateExpense(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    const project = await ensureProjectMember(expense.project, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const { title, amount, notes } = req.body;
    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = amount;
    if (notes !== undefined) expense.notes = notes;
    await expense.save();
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

// Delete an expense
async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    const project = await ensureProjectMember(expense.project, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    await expense.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createExpense, getExpenses, updateExpense, deleteExpense };


