const mongoose = require('mongoose');

// Task schema under a project
const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);


