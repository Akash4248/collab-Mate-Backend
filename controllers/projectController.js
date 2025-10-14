const { validationResult } = require('express-validator');
const Project = require('../models/Project');

// Create a new project and add owner as member
async function createProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id],
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

// Get all projects where user is a member
async function getMyProjects(req, res, next) {
  try {
    const projects = await Project.find({ members: req.user.id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

// Update project by id (must be owner)
async function updateProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can update project' });
    }
    project.name = req.body.name ?? project.name;
    project.description = req.body.description ?? project.description;
    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
}

// Delete project by id (must be owner)
async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete project' });
    }
    await project.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createProject, getMyProjects, updateProject, deleteProject };


