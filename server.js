// CollabMate Backend Server
// Express server with MongoDB (Mongoose) and Socket.io for real-time chat

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Utils & Middlewares
const { errorHandler, notFoundHandler } = require('./utils/errorHandlers');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS for Expo dev and Android emulator
const io = new Server(server, {
  cors: {
    origin: '*', // In production, tighten this
    methods: ['GET', 'POST']
  }
});

// Store io in app locals so controllers can emit events
app.locals.io = io;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'CollabMate backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/messages', messageRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.io: handle project room joins and new messages
io.on('connection', (socket) => {
  // Join a project room to receive chat/messages updates
  socket.on('joinProject', (projectId) => {
    socket.join(`project:${projectId}`);
  });

  // Leave project room
  socket.on('leaveProject', (projectId) => {
    socket.leave(`project:${projectId}`);
  });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabmate';
const PORT = process.env.PORT || 4000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`CollabMate backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });


