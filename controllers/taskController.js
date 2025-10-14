const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Verify user is a member of the project
async function ensureProjectMember(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isMember = project.members.some((m) => m.toString() === userId);
  return isMember ? project : null;
}

// Create a task under a project
async function createTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { projectId } = req.params;
    const { title, description, dueDate, assignee } = req.body;
    const project = await ensureProjectMember(projectId, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const task = await Task.create({ project: projectId, title, description, dueDate, assignee });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// Get tasks for a project
async function getTasks(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await ensureProjectMember(projectId, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const tasks = await Task.find({ project: projectId }).sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// Update a task
async function updateTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const project = await ensureProjectMember(task.project, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const { title, description, status, dueDate, assignee } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignee !== undefined) task.assignee = assignee;
    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// Delete a task
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const project = await ensureProjectMember(task.project, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    await task.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, getTasks, updateTask, deleteTask };


