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
// Behind Railway/Reverse proxies
app.set('trust proxy', 1);

// CORS origins (set CORS_ORIGIN env to a single origin or comma-separated list)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const allowedOrigins = CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((s) => s.trim());
const allowCredentials = allowedOrigins !== '*' && Array.isArray(allowedOrigins) && allowedOrigins.length > 0;

// Configure Socket.io with CORS for Expo dev / Android emulator / Atlas-backed API consumers
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: allowCredentials,
  }
});

// Store io in app locals so controllers can emit events
app.locals.io = io;

// Middlewares
app.use(
  cors({
    origin: allowedOrigins,
    credentials: allowCredentials,
  })
);
app.use(express.json());

// Health check
let dbStatus = 'disconnected';
app.get('/', (req, res) => {
  res.type('application/json').send({ status: 'ok', service: 'CollabMate backend', db: dbStatus });
});
app.head('/', (req, res) => {
  res.status(200).end();
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbStatus });
});
app.head('/health', (req, res) => {
  res.status(200).end();
});
app.get('/ping', (req, res) => res.send('pong'));
app.get('/api/healthz', (req, res) => res.json({ ok: true, db: dbStatus }));

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

// MongoDB connection with resilient startup for PaaS (e.g., Railway)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabmate';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || undefined; // Optional override for Atlas
const PORT = process.env.PORT || 4000;

mongoose.set('strictQuery', true);

async function connectWithRetry(maxAttempts = 20, delayMs = 3000) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      attempt += 1;
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        dbName: MONGO_DB_NAME,
      });
      dbStatus = 'connected';
      console.log('MongoDB connected');
      break;
    } catch (err) {
      dbStatus = 'disconnected';
      console.error(`MongoDB connection attempt ${attempt} failed:`, err?.message || err);
      if (attempt >= maxAttempts) {
        console.error('Max MongoDB connection attempts reached. Continuing without DB.');
        break;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// Start HTTP server immediately so the platform health checks succeed
server.listen(PORT, '0.0.0.0', () => {
  console.log(`CollabMate backend running on port ${PORT}`);
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set. Falling back to local MongoDB at 127.0.0.1. Set MONGO_URI to your Atlas URI in Railway.');
  }
  if (process.env.RAILWAY_ENVIRONMENT && /127\.0\.0\.1|localhost/.test(MONGO_URI)) {
    console.warn('Detected Railway environment but MONGO_URI points to localhost. Update MONGO_URI to an Atlas connection string.');
  }
});

// Connect to MongoDB in background with retries
connectWithRetry();

// Update dbStatus on runtime connection state changes
mongoose.connection.on('connected', () => {
  dbStatus = 'connected';
});
mongoose.connection.on('disconnected', () => {
  dbStatus = 'disconnected';
});
mongoose.connection.on('error', (err) => {
  dbStatus = 'error';
  console.error('MongoDB connection error:', err?.message || err);
});

// Graceful shutdown for Railway/Docker
function shutdown() {
  console.log('Shutting down...');
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      process.exit(0);
    });
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Catch-all process error logging (do not crash)
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});


