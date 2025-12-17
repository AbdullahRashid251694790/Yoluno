import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import passport from 'passport';

import { configurePassport } from './config/passport.js';
import { pool, testConnection } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { setupSocketHandlers } from './socket/index.js';

// Routes
import authRoutes from './routes/auth.js';
import childProfilesRoutes from './routes/childProfiles.js';
import storiesRoutes from './routes/stories.js';
import familyRoutes from './routes/family.js';
import journeysRoutes from './routes/journeys.js';
import guardrailsRoutes from './routes/guardrails.js';
import avatarsRoutes from './routes/avatars.js';
import buddyChatRoutes from './routes/buddyChat.js';
import ttsRoutes from './routes/tts.js';
import transcribeRoutes from './routes/transcribe.js';
import storyGenerationRoutes from './routes/storyGeneration.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Passport
configurePassport(passport);
app.use(passport.initialize());

// Static files for uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(uploadDir));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Yoluno API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/child-profiles', childProfilesRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/journeys', journeysRoutes);
app.use('/api/guardrails', guardrailsRoutes);
app.use('/api/avatars', avatarsRoutes);
app.use('/api/buddy-chat', buddyChatRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/generate-story', storyGenerationRoutes);
app.use('/api/upload', uploadRoutes);

// Error handler
app.use(errorHandler);

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Test database connection
    await testConnection();
    console.log('Database connected successfully');

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await pool.end();
  process.exit(0);
});

export { app, io };
