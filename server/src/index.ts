import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env.local first (local overrides), then fall back to .env
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
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
import gamificationRoutes from './routes/gamification.js';
import journeyTemplatesRoutes from './routes/journeyTemplates.js';
import analyticsRoutes from './routes/analytics.js';
import topicsRoutes from './routes/topics.js';
import contentLibraryRoutes from './routes/contentLibrary.js';
import voiceVaultRoutes from './routes/voiceVault.js';
import familyEventsRoutes from './routes/familyEvents.js';
import kidsModeRoutes from './routes/kidsMode.js';
import onboardingRoutes from './routes/onboarding.js';
import journeyRemindersRoutes from './routes/journeyReminders.js';
import journeyRewardsRoutes from './routes/journeyRewards.js';
import notificationsRoutes from './routes/notifications.js';
import moodCheckinRoutes from './routes/moodCheckin.js';
import dataExportRoutes from './routes/dataExport.js';

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
app.use(cookieParser());
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

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window for sensitive endpoints
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', strictAuthLimiter);
app.use('/api/auth/reset-password', strictAuthLimiter);

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
app.use('/api/gamification', gamificationRoutes);
app.use('/api/journey-templates', journeyTemplatesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/content-library', contentLibraryRoutes);
app.use('/api/voice-vault', voiceVaultRoutes);
app.use('/api/family-events', familyEventsRoutes);
app.use('/api/kids-mode', kidsModeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/journey-reminders', journeyRemindersRoutes);
app.use('/api/journey-rewards', journeyRewardsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/mood-checkin', moodCheckinRoutes);
app.use('/api/data-export', dataExportRoutes);

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
