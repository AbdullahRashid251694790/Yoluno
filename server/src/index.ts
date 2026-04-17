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
import voiceInviteRoutes from './routes/voiceInvite.js';
import familyEventsRoutes from './routes/familyEvents.js';
import kidsModeRoutes from './routes/kidsMode.js';
import kidNotificationsRoutes from './routes/kidNotifications.js';
import onboardingRoutes from './routes/onboarding.js';
import journeyRemindersRoutes from './routes/journeyReminders.js';
import journeyRewardsRoutes from './routes/journeyRewards.js';
import notificationsRoutes from './routes/notifications.js';
import moodCheckinRoutes from './routes/moodCheckin.js';
import dataExportRoutes from './routes/dataExport.js';
import dailyMissionsRoutes from './routes/dailyMissions.js';
import sharedMomentsRoutes from './routes/sharedMoments.js';
import safetySettingsRoutes from './routes/safetySettings.js';
import weeklyReportRoutes from './routes/weeklyReport.js';

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

// Trust first proxy (Railway runs behind a reverse proxy)
app.set('trust proxy', 1);

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

// Health check — verifies DB is reachable
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Health check DB fail:', (err as Error).message);
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
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
app.use('/api/auth/resend-verification', strictAuthLimiter);

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
app.use('/api/invite', voiceInviteRoutes);
app.use('/api/family-events', familyEventsRoutes);
app.use('/api/kids-mode', kidsModeRoutes);
app.use('/api/kids', kidNotificationsRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Dynamic load of seed route (gitignored — only works locally)
const seedPath = './routes/seedFamilyDemo.js';
import(/* @vite-ignore */ seedPath)
  .then((mod) => { app.use('/api/seed', mod.default); console.log('Seed demo route loaded'); })
  .catch(() => { /* seedFamilyDemo.ts not present — skip */ });
app.use('/api/journey-reminders', journeyRemindersRoutes);
app.use('/api/journey-rewards', journeyRewardsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/mood-checkin', moodCheckinRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/daily-missions', dailyMissionsRoutes);
app.use('/api/shared-moments', sharedMomentsRoutes);
app.use('/api/safety-settings', safetySettingsRoutes);
app.use('/api/weekly-report', weeklyReportRoutes);

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

      // Weekly safety email cron — runs every Monday at 8 AM UTC
      scheduleWeeklyReport();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Weekly safety report cron — checks every hour, fires on Monday 8 AM UTC
let lastWeeklyRun = '';
function scheduleWeeklyReport() {
  const check = async () => {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun, 1=Mon
    const hour = now.getUTCHours();
    const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Fire on Monday at 8 AM UTC, once per day
    if (day === 1 && hour === 8 && lastWeeklyRun !== dateKey) {
      lastWeeklyRun = dateKey;
      console.log('Triggering weekly safety report emails...');
      try {
        // Import and call the send logic directly
        const { query: dbQuery } = await import('./config/database.js');
        const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
        const FROM_EMAIL = process.env.FROM_EMAIL || 'Yoluno <noreply@yoluno.ai>';

        if (!RESEND_API_KEY) {
          console.log('Weekly report skipped — RESEND_API_KEY not set');
          return;
        }

        const usersResult = await dbQuery<{ user_id: string; email: string }>(
          `SELECT uss.user_id, u.email
           FROM user_safety_settings uss
           INNER JOIN users u ON u.id = uss.user_id
           WHERE uss.weekly_summary = true AND u.email IS NOT NULL`
        );

        let sent = 0;
        for (const user of usersResult.rows) {
          const reportsResult = await dbQuery<{
            severity: string; issue_summary: string; ai_analysis: string | null;
            child_name: string | null; created_at: string;
          }>(
            `SELECT sr.severity, sr.issue_summary, sr.ai_analysis,
                    cp.name as child_name, sr.created_at::text
             FROM safety_reports sr
             LEFT JOIN child_profiles cp ON sr.child_profile_id = cp.id
             WHERE sr.user_id = $1 AND sr.created_at >= NOW() - INTERVAL '7 days'
             ORDER BY sr.created_at DESC`,
            [user.user_id]
          );

          const reports = reportsResult.rows;
          const redirections = reports.filter((r) => r.severity === 'yellow');
          const safetyReports = reports.filter((r) => r.severity === 'red');

          // Build simple HTML email
          const html = `
<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;">
  <h1 style="font-size:24px;color:#2A2926;">Weekly Safety Summary</h1>
  <p style="color:#9B978E;font-size:14px;">Your children's safety digest for the past 7 days</p>
  <div style="display:flex;gap:12px;margin:20px 0;">
    <div style="flex:1;background:#E8F6F4;border-radius:8px;padding:16px;text-align:center;">
      <p style="font-size:24px;font-weight:600;color:#2A2926;margin:0;">${reports.length}</p>
      <p style="font-size:12px;color:#9B978E;margin:4px 0 0;">Total</p>
    </div>
    <div style="flex:1;background:#FDF6E8;border-radius:8px;padding:16px;text-align:center;">
      <p style="font-size:24px;font-weight:600;color:#2A2926;margin:0;">${redirections.length}</p>
      <p style="font-size:12px;color:#9B978E;margin:4px 0 0;">Redirections</p>
    </div>
    <div style="flex:1;background:#FEF0EA;border-radius:8px;padding:16px;text-align:center;">
      <p style="font-size:24px;font-weight:600;color:#2A2926;margin:0;">${safetyReports.length}</p>
      <p style="font-size:12px;color:#9B978E;margin:4px 0 0;">Reports</p>
    </div>
  </div>
  ${reports.length === 0 ? '<div style="background:#E8F6F4;border-radius:12px;padding:32px;text-align:center;margin:20px 0;"><p style="font-size:28px;margin:0 0 8px;">&#10003;</p><p style="font-size:16px;font-weight:600;color:#2A2926;margin:0 0 8px;">All clear this week!</p><p style="font-size:14px;color:#6B675E;margin:0;line-height:1.6;">All your children stayed within the boundaries you set. No topics were redirected and no safety concerns were flagged. Keep up the great parenting!</p></div>' :
    reports.map((r) => `
      <div style="border-left:3px solid ${r.severity === 'yellow' ? '#D4A843' : '#E8946A'};padding:12px 16px;margin:8px 0;background:#FAFAF7;border-radius:8px;">
        <p style="font-size:12px;color:#9B978E;margin:0 0 4px;">${r.child_name || 'Child'}</p>
        <p style="font-size:14px;color:#2A2926;margin:0 0 4px;">${r.issue_summary}</p>
        ${r.ai_analysis ? `<p style="font-size:13px;color:#6B675E;margin:0;">${r.ai_analysis}</p>` : ''}
      </div>`).join('')}
  <p style="font-size:12px;color:#9B978E;text-align:center;margin-top:24px;">Powered by Yoluno</p>
</div>`;

          try {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: FROM_EMAIL,
                to: [user.email],
                subject: `Yoluno Weekly Safety Summary — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                html,
              }),
            });
            if (res.ok) sent++;
            else console.error(`Weekly email failed for ${user.email}:`, await res.text());
          } catch (err) {
            console.error(`Weekly email error for ${user.email}:`, err);
          }
        }
        console.log(`Weekly safety report: sent ${sent}/${usersResult.rows.length} emails`);
      } catch (err) {
        console.error('Weekly report cron error:', err);
      }
    }
  };

  // Check every hour
  setInterval(check, 60 * 60 * 1000);
  // Also check once on startup (in case server restarts on Monday morning)
  setTimeout(check, 10_000);
  console.log('Weekly safety report cron scheduled (Monday 8 AM UTC)');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await pool.end();
  process.exit(0);
});

// Prevent crashes from unhandled errors
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

export { app, io };
