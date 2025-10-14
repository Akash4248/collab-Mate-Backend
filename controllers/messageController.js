const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const Project = require('../models/Project');

// Verify user is a member of the project
async function ensureProjectMember(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isMember = project.members.some((m) => m.toString() === userId);
  return isMember ? project : null;
}

// Create a message and emit via Socket.io to project room
async function createMessage(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { projectId } = req.params;
    const { content } = req.body;
    const project = await ensureProjectMember(projectId, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const message = await Message.create({ project: projectId, sender: req.user.id, content });
    // Emit new message to project room using socket.io
    const io = req.app.locals.io;
    io.to(`project:${projectId}`).emit('newMessage', {
      _id: message._id,
      project: projectId,
      sender: req.user.id,
      content: message.content,
      createdAt: message.createdAt,
    });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

// Get messages for a project
async function getMessages(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await ensureProjectMember(projectId, req.user.id);
    if (!project) return res.status(403).json({ message: 'Not authorized' });
    const messages = await Message.find({ project: projectId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

module.exports = { createMessage, getMessages };


