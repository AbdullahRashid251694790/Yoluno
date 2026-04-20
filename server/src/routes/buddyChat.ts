import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import multer from 'multer';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToUser, emitToChild } from '../socket/index.js';
import { uploadFile, getFileUrl } from '../utils/storage.js';
import type { BuddyMessage, ChatBuddy, SafetyReport, ChildProfile, GuardrailSettings, Journey, JourneyStep } from '../types/index.js';
import { logActivityForChild, awardJourneyCompletionBadge, type BadgeDefinition } from '../helpers/gamification.js';

const router = Router();

// Configure multer for memory storage (images)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
    }
  },
});

// Session title constants
const DEFAULT_SESSION_TITLE = 'New Chat';
const GENERIC_SESSION_TITLE = 'Chat with Luno';

// Task completion keywords
const COMPLETION_KEYWORDS = ['done', 'finished', 'completed', 'i did it', 'all done', 'look what i made', 'i finished'];

router.use(requireAuth);

// Safety keywords — comprehensive child safety detection
const RED_FLAG_KEYWORDS = [
  // Violence
  'kill', 'murder', 'stab', 'shoot', 'gun', 'weapon', 'knife', 'blood',
  // Self-harm / suicidal
  'suicide', 'kill myself', 'hurt myself', 'want to die', 'don\'t want to live',
  'don\'t want to be here', 'end my life', 'cut myself',
  // Abuse indicators
  'touched me', 'makes me undress', 'secret touching', 'don\'t tell anyone',
  'hits me', 'beats me', 'molest',
  // Explicit content
  'sex', 'porn', 'naked', 'nude',
];

const YELLOW_FLAG_KEYWORDS = [
  // Profanity / bad language
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'dick', 'bastard',
  'wtf', 'stfu', 'idiot', 'retard',
  // Bullying (being bullied or bullying)
  'bully', 'bullied', 'bullying', 'picked on', 'made fun of', 'laughed at me',
  'pushed me', 'hit me', 'punched', 'kicked me', 'nobody likes me',
  'no friends', 'left out', 'excluded',
  // Emotional distress
  'hate myself', 'i\'m worthless', 'i\'m ugly', 'i\'m stupid', 'i\'m dumb',
  'nobody cares', 'nobody loves me', 'want to run away', 'scared of',
  'afraid of', 'having nightmares', 'can\'t sleep',
  // Anger / conflict
  'stupid', 'dumb', 'shut up', 'i hate', 'angry', 'fight', 'fighting',
  // General concerning
  'scared', 'lonely', 'alone', 'crying', 'depressed', 'anxious', 'worried',
  'hurt', 'pain', 'mean to me',
];

function analyzeSafety(message: string): { level: 'green' | 'yellow' | 'red'; flags: string[] } {
  const lowerMessage = message.toLowerCase();
  const flags: string[] = [];

  // Use word-boundary regex so "hello" doesn't match "hell",
  // "class" doesn't match "ass", "shitake" doesn't match "shit", etc.
  const matchesWord = (text: string, word: string) => {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    return re.test(text);
  };

  // Check red flags first (most serious)
  for (const keyword of RED_FLAG_KEYWORDS) {
    if (matchesWord(lowerMessage, keyword)) {
      flags.push(keyword);
    }
  }

  if (flags.length > 0) {
    return { level: 'red', flags };
  }

  // Check yellow flags
  for (const keyword of YELLOW_FLAG_KEYWORDS) {
    if (matchesWord(lowerMessage, keyword)) {
      flags.push(keyword);
    }
  }

  if (flags.length > 0) {
    return { level: 'yellow', flags };
  }

  return { level: 'green', flags: [] };
}

async function verifyChildAccess(childId: string, userId: string): Promise<ChildProfile> {
  const child = await queryOne<ChildProfile>(
    'SELECT * FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  if (!child) {
    throw new AppError(403, 'Access denied to child profile');
  }
  return child;
}

// GET /api/buddy-chat/:childId/messages
router.get('/:childId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const { limit = '50', offset = '0' } = req.query;

    const result = await query<BuddyMessage>(
      `SELECT * FROM buddy_messages
       WHERE child_profile_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.childId, parseInt(limit as string), parseInt(offset as string)]
    );

    // Return in chronological order
    res.json(result.rows.reverse());
  } catch (error) {
    next(error);
  }
});

// GET /api/buddy-chat/:childId/buddy
router.get('/:childId/buddy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    let buddy = await queryOne<ChatBuddy>(
      `SELECT id, child_profile_id, name as buddy_name, personality_traits, use_custom_personality,
              conversation_context, learned_preferences, message_count as total_messages,
              last_interaction_at, created_at, updated_at, NULL as buddy_avatar_url
       FROM chat_buddies WHERE child_profile_id = $1`,
      [req.params.childId]
    );

    // Auto-create buddy if doesn't exist with default personality (all 5/10)
    if (!buddy) {
      const id = uuidv4();
      const defaultTraits = { curious: 5, patient: 5, playful: 5, educational: 5, empathetic: 5 };
      buddy = await queryOne<ChatBuddy>(
        `INSERT INTO chat_buddies (id, child_profile_id, name, personality_traits, message_count)
         VALUES ($1, $2, 'Luno', $3, 0)
         RETURNING id, child_profile_id, name as buddy_name, personality_traits, use_custom_personality,
                   conversation_context, learned_preferences, message_count as total_messages,
                   last_interaction_at, created_at, updated_at, NULL as buddy_avatar_url`,
        [id, req.params.childId, JSON.stringify(defaultTraits)]
      );
    }

    res.json(buddy);
  } catch (error) {
    next(error);
  }
});

// POST /api/buddy-chat/:childId/send
router.post('/:childId/send', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io: Server = req.app.get('io');
    const { message } = req.body;
    const childId = req.params.childId;
    const imageFile = req.file;

    if (!message || typeof message !== 'string') {
      throw new AppError(400, 'Message is required');
    }

    const child = await verifyChildAccess(childId, req.user!.id);

    // Analyze safety of input
    const inputSafety = analyzeSafety(message);

    // Handle image upload if present
    let imageKey: string | null = null;
    let imageAnalysis: string | null = null;

    if (imageFile) {
      const ext = imageFile.mimetype.split('/')[1] || 'jpg';
      const filename = `${Date.now()}-${uuidv4()}.${ext}`;
      imageKey = `chat-images/${childId}/${filename}`;
      await uploadFile(imageKey, imageFile.buffer, imageFile.mimetype);

      // Analyze image using vision model
      imageAnalysis = await analyzeImage(imageFile.buffer, imageFile.mimetype);
    }

    // Save child message with image info
    const childMessageId = uuidv4();
    const childMessage = await queryOne<BuddyMessage>(
      `INSERT INTO buddy_messages (id, child_profile_id, role, content, safety_level, safety_flags, image_key, image_analysis)
       VALUES ($1, $2, 'child', $3, $4, $5, $6, $7)
       RETURNING *`,
      [childMessageId, childId, message, inputSafety.level, JSON.stringify({ flags: inputSafety.flags }), imageKey, imageAnalysis]
    );

    // Emit to connected clients
    emitToChild(io, childId, 'new-message', childMessage);

    // Create safety report if needed
    if (inputSafety.level === 'red' || inputSafety.level === 'yellow') {
      const reportId = uuidv4();
      let report: SafetyReport | null = null;
      try {
        report = await queryOne<SafetyReport>(
          `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary, report_type)
           VALUES ($1, $2, $3, $4, $5, $6, 'language')
           RETURNING *`,
          [reportId, req.user!.id, childId, childMessageId, inputSafety.level,
           `Child used concerning language: ${inputSafety.flags.join(', ')}`]
        );
      } catch {
        // Fallback if report_type column doesn't exist yet (migration 062 not run)
        report = await queryOne<SafetyReport>(
          `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [reportId, req.user!.id, childId, childMessageId, inputSafety.level,
           `Child used concerning language: ${inputSafety.flags.join(', ')}`]
        );
      }

      // Emit safety alert to parent
      emitToUser(io, req.user!.id, 'safety-alert', report);
    }

    // Check for task completion
    const taskCompletion = await checkTaskCompletion(childId, message, imageKey, imageAnalysis);

    // Generate buddy response using AI
    const buddyResponse = await generateBuddyResponse(childId, message, child, inputSafety, imageAnalysis, taskCompletion);

    // Save buddy response
    const buddyMessageId = uuidv4();
    const buddyMessage = await queryOne<BuddyMessage>(
      `INSERT INTO buddy_messages (id, child_profile_id, role, content, safety_level)
       VALUES ($1, $2, 'buddy', $3, 'green')
       RETURNING *`,
      [buddyMessageId, childId, buddyResponse]
    );

    // Emit buddy response
    emitToChild(io, childId, 'new-message', buddyMessage);

    // Update buddy stats
    await query(
      `UPDATE chat_buddies
       SET message_count = message_count + 2, last_interaction_at = NOW()
       WHERE child_profile_id = $1`,
      [childId]
    );

    // If task was completed, emit event
    if (taskCompletion?.completed) {
      emitToUser(io, req.user!.id, 'task-completed', {
        childId,
        journeyId: taskCompletion.journeyId,
        stepId: taskCompletion.stepId,
        journeyCompleted: taskCompletion.journeyCompleted,
        rewardEarned: taskCompletion.rewardEarned,
        badgesEarned: taskCompletion.badgesEarned || [],
      });

      // Also emit badges to child for celebration
      if (taskCompletion.badgesEarned && taskCompletion.badgesEarned.length > 0) {
        emitToChild(io, childId, 'badges-earned', {
          badges: taskCompletion.badgesEarned,
        });
      }
    }

    res.json({
      childMessage,
      buddyMessage,
      safetyLevel: inputSafety.level,
      taskCompleted: taskCompletion?.completed || false,
      badgesEarned: taskCompletion?.badgesEarned || [],
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// CHAT SESSIONS API
// ============================================

interface ChatSession {
  id: string;
  child_profile_id: string;
  title: string;
  mood: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
  is_active: boolean;
  created_at: string;
}

// GET /api/buddy-chat/:childId/sessions - Get all sessions for a child
router.get('/:childId/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const { limit = '20', includeInactive = 'false' } = req.query;

    const result = await query<ChatSession>(
      `SELECT * FROM chat_sessions
       WHERE child_profile_id = $1
       ${includeInactive === 'true' ? '' : 'AND is_active = true'}
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.params.childId, parseInt(limit as string)]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/buddy-chat/:childId/sessions - Create a new session
router.post('/:childId/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const childId = req.params.childId;
    const { mood, title } = req.body;

    await verifyChildAccess(childId, req.user!.id);

    const sessionId = uuidv4();
    const sessionTitle = title || (mood ? `${moodTitleLabel(mood)} mood chat` : DEFAULT_SESSION_TITLE);

    const session = await queryOne<ChatSession>(
      `INSERT INTO chat_sessions (id, child_profile_id, title, mood, started_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [sessionId, childId, sessionTitle, mood || null]
    );

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// GET /api/buddy-chat/:childId/sessions/:sessionId - Get session with messages
router.get('/:childId/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, sessionId } = req.params;
    await verifyChildAccess(childId, req.user!.id);

    // Get session
    const session = await queryOne<ChatSession>(
      `SELECT * FROM chat_sessions WHERE id = $1 AND child_profile_id = $2`,
      [sessionId, childId]
    );

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Get messages for this session
    const messagesResult = await query<BuddyMessage>(
      `SELECT * FROM buddy_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    res.json({
      session,
      messages: messagesResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/buddy-chat/:childId/sessions/:sessionId/messages - Get messages for a session
router.get('/:childId/sessions/:sessionId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, sessionId } = req.params;
    await verifyChildAccess(childId, req.user!.id);

    const result = await query<BuddyMessage>(
      `SELECT * FROM buddy_messages
       WHERE session_id = $1 AND child_profile_id = $2
       ORDER BY created_at ASC`,
      [sessionId, childId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/buddy-chat/:childId/sessions/:sessionId - Update session (title, archive)
router.patch('/:childId/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, sessionId } = req.params;
    const { title, is_active } = req.body;

    await verifyChildAccess(childId, req.user!.id);

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No updates provided');
    }

    updates.push(`updated_at = NOW()`);
    values.push(sessionId, childId);

    const session = await queryOne<ChatSession>(
      `UPDATE chat_sessions
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND child_profile_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/buddy-chat/:childId/sessions/:sessionId - Delete a chat session
router.delete('/:childId/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, sessionId } = req.params;
    await verifyChildAccess(childId, req.user!.id);

    // Messages CASCADE via session_id FK; shared_moments with reference_id=sessionId stay
    const result = await query(
      `DELETE FROM chat_sessions WHERE id = $1 AND child_profile_id = $2`,
      [sessionId, childId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Session not found');
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/buddy-chat/:childId/sessions/:sessionId/send - Send message in session
router.post('/:childId/sessions/:sessionId/send', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io: Server = req.app.get('io');
    const { message } = req.body;
    const { childId, sessionId } = req.params;
    const imageFile = req.file;

    if (!message || typeof message !== 'string') {
      throw new AppError(400, 'Message is required');
    }

    const child = await verifyChildAccess(childId, req.user!.id);

    // Verify session exists
    const session = await queryOne<ChatSession>(
      `SELECT * FROM chat_sessions WHERE id = $1 AND child_profile_id = $2`,
      [sessionId, childId]
    );

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Analyze safety of input
    const inputSafety = analyzeSafety(message);

    // Handle image upload if present
    let imageKey: string | null = null;
    let imageAnalysis: string | null = null;

    if (imageFile) {
      const ext = imageFile.mimetype.split('/')[1] || 'jpg';
      const filename = `${Date.now()}-${uuidv4()}.${ext}`;
      imageKey = `chat-images/${childId}/${filename}`;
      await uploadFile(imageKey, imageFile.buffer, imageFile.mimetype);
      imageAnalysis = await analyzeImage(imageFile.buffer, imageFile.mimetype);
    }

    // Save child message with session_id
    const childMessageId = uuidv4();
    const childMessage = await queryOne<BuddyMessage>(
      `INSERT INTO buddy_messages (id, child_profile_id, session_id, role, content, safety_level, safety_flags, image_key, image_analysis)
       VALUES ($1, $2, $3, 'child', $4, $5, $6, $7, $8)
       RETURNING *`,
      [childMessageId, childId, sessionId, message, inputSafety.level, JSON.stringify({ flags: inputSafety.flags }), imageKey, imageAnalysis]
    );

    // Emit to connected clients
    emitToChild(io, childId, 'new-message', { ...childMessage, sessionId });

    // Create safety report if needed
    if (inputSafety.level === 'red' || inputSafety.level === 'yellow') {
      const reportId = uuidv4();
      let report: SafetyReport | null = null;
      try {
        report = await queryOne<SafetyReport>(
          `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary, report_type)
           VALUES ($1, $2, $3, $4, $5, $6, 'language')
           RETURNING *`,
          [reportId, req.user!.id, childId, childMessageId, inputSafety.level,
           `Child used concerning language: ${inputSafety.flags.join(', ')}`]
        );
      } catch {
        // Fallback if report_type column doesn't exist yet (migration 062 not run)
        report = await queryOne<SafetyReport>(
          `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [reportId, req.user!.id, childId, childMessageId, inputSafety.level,
           `Child used concerning language: ${inputSafety.flags.join(', ')}`]
        );
      }
      emitToUser(io, req.user!.id, 'safety-alert', report);

      // Create a dashboard notification if the user has notify_on_report enabled
      if (inputSafety.level === 'red') {
        const notifyPrefs = await queryOne<{ notify_on_report: boolean }>(
          'SELECT notify_on_report FROM user_safety_settings WHERE user_id = $1',
          [req.user!.id]
        );
        if (notifyPrefs?.notify_on_report !== false) {
          await query(
            `INSERT INTO parent_notifications (user_id, child_profile_id, notification_type, title, message)
             VALUES ($1, $2, 'other', $3, $4)`,
            [
              req.user!.id, childId,
              'Safety Report Generated',
              `A safety concern was detected in ${child.name}'s conversation: ${inputSafety.flags.join(', ')}. Review it in the Safety dashboard.`,
            ]
          ).catch(() => {});
        }
      }
    }

    // Check if the child's message touches a banned topic
    console.log('[TOPIC CHECK] Checking banned topics for child:', childId, 'message:', message.slice(0, 50));
    const bannedTopicMatch = await checkBannedTopics(childId, message);
    console.log('[TOPIC CHECK] Result:', bannedTopicMatch ? `BANNED: ${bannedTopicMatch.topicName}` : 'No match');
    let buddyResponse: string;

    let taskCompletion: Awaited<ReturnType<typeof checkTaskCompletion>> | null = null;

    if (bannedTopicMatch) {
      // Generate a gentle redirect instead of answering
      buddyResponse = await generateTopicRedirect(
        child.name, child.age, message,
        bannedTopicMatch.topicName, bannedTopicMatch.categoryName
      );

      // Log as topic_redirect safety report
      const redirectReportId = uuidv4();
      const issueSummary = `${child.name} asked about: "${message.length > 100 ? message.slice(0, 100) + '...' : message}"`;
      const fullContext = {
        ai_analysis: `Luno gently redirected the conversation. Topic boundary: ${bannedTopicMatch.categoryName} — ${bannedTopicMatch.topicName} (restricted by parent)`,
        topic_name: bannedTopicMatch.topicName,
        category_name: bannedTopicMatch.categoryName,
      };

      // Try with report_type column first; fall back without it if migration 062 not yet run
      try {
        await query(
          `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary, full_context, report_type)
           VALUES ($1, $2, $3, $4, 'yellow', $5, $6, 'topic_redirect')`,
          [redirectReportId, req.user!.id, childId, childMessageId, issueSummary, JSON.stringify(fullContext)]
        );
      } catch {
        await query(
          `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary, full_context)
           VALUES ($1, $2, $3, $4, 'yellow', $5, $6)`,
          [redirectReportId, req.user!.id, childId, childMessageId, issueSummary, JSON.stringify(fullContext)]
        ).catch((e) => console.error('[topic_redirect] failed to log safety report:', e.message));
      }

      // Notify parent in real-time only if they opted in
      const safetyPrefs = await queryOne<{ notify_on_redirect: boolean }>(
        'SELECT notify_on_redirect FROM user_safety_settings WHERE user_id = $1',
        [req.user!.id]
      );
      if (safetyPrefs?.notify_on_redirect) {
        // Create a dashboard bell notification
        await query(
          `INSERT INTO parent_notifications (user_id, child_profile_id, notification_type, title, message)
           VALUES ($1, $2, 'other', $3, $4)`,
          [
            req.user!.id,
            childId,
            'Topic Redirected',
            `${child.name} asked about a restricted topic (${bannedTopicMatch.topicName}) and Luno gently redirected the conversation.`,
          ]
        ).catch(() => {});

        emitToUser(io, req.user!.id, 'safety-alert', {
          childId, childName: child.name, severity: 'yellow',
          summary: `${child.name} asked about a restricted topic: ${bannedTopicMatch.topicName}`,
        });
      }
    } else {
      // Normal flow: check task completion + generate AI response
      taskCompletion = await checkTaskCompletion(childId, message, imageKey, imageAnalysis);

      // Quick-action: "Explore a topic" — pick a random allowed topic for this
      // child and expand the prompt so Luno asks "Want to learn about X?".
      // The child's saved message stays as "Explore a topic" (clean UI).
      let promptForAI = message;
      if (message.trim().toLowerCase() === 'explore a topic') {
        const allowed = await query<{ name: string }>(
          `SELECT t.name FROM topics t
           LEFT JOIN child_topic_settings cts
             ON cts.topic_id = t.id AND cts.child_profile_id = $1
           WHERE t.is_active = true
             AND (cts.is_allowed IS NULL OR cts.is_allowed = true)
             AND t.age_appropriate_min <= $2
             AND t.age_appropriate_max >= $2
           ORDER BY random()
           LIMIT 1`,
          [childId, child.age]
        );
        const topicName = allowed.rows[0]?.name;
        if (topicName) {
          promptForAI = `The child wants to explore a random topic. You picked "${topicName}". Respond with exactly one short question: "Want to learn about ${topicName}?" — nothing else, no extra text, no preamble. Wait for their yes or no before explaining anything.`;
        } else {
          promptForAI = 'The child wants to explore a topic but no specific topic is configured. Ask them in one short sentence what they feel like learning about.';
        }
      }

      buddyResponse = await generateBuddyResponse(childId, promptForAI, child, inputSafety, imageAnalysis, taskCompletion, sessionId);
    }

    // Save buddy response with session_id
    const buddyMessageId = uuidv4();
    const buddyMessage = await queryOne<BuddyMessage>(
      `INSERT INTO buddy_messages (id, child_profile_id, session_id, role, content, safety_level)
       VALUES ($1, $2, $3, 'buddy', $4, 'green')
       RETURNING *`,
      [buddyMessageId, childId, sessionId, buddyResponse]
    );

    // Emit buddy response
    emitToChild(io, childId, 'new-message', { ...buddyMessage, sessionId });

    // Update buddy stats
    await query(
      `UPDATE chat_buddies
       SET message_count = message_count + 2, last_interaction_at = NOW()
       WHERE child_profile_id = $1`,
      [childId]
    );

    // Update session message count and last_message_at
    await query(
      `UPDATE chat_sessions
       SET message_count = message_count + 2, last_message_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    // Log per-session chat points (only on first message in session)
    if (session.message_count === 0) {
      logActivityForChild(childId, 'chat_session_completed', { sessionId }).catch((err) => {
        console.error('Failed to log chat session activity:', err);
      });
    }

    // Auto-generate session title on first exchange, or re-generate on second
    // exchange if the first title was generic (e.g. child just said "hi")
    const isDefaultTitle = session.title === DEFAULT_SESSION_TITLE || session.title.endsWith('mood chat');
    const isGenericTitle = session.title === GENERIC_SESSION_TITLE;
    if (isDefaultTitle || (isGenericTitle && session.message_count <= 2)) {
      generateSessionTitle(sessionId, message, buddyResponse).catch((err) => {
        console.error('Failed to auto-generate session title:', err);
      });
    }

    // Auto-create "curiosity" Growth Journal moment when the child sends
    // their 5th message in this session (deep conversation trigger).
    const newMessageCount = session.message_count + 2; // +2 for child+buddy
    if (newMessageCount >= 10 && session.message_count < 10) {
      // Re-fetch the session to get the latest AI-generated title which
      // describes what the conversation is about (far more reliable than
      // ILIKE matching child messages against topic names).
      const freshSession = await queryOne<{ title: string }>(
        'SELECT title FROM chat_sessions WHERE id = $1',
        [sessionId]
      );
      const sessionTitle = freshSession?.title || 'something interesting';
      const questionCount = Math.floor(newMessageCount / 2);

      // One curiosity moment per session max
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM shared_moments
         WHERE child_profile_id = $1 AND moment_type = 'curiosity'
           AND reference_id = $2::uuid`,
        [childId, sessionId]
      );
      if (!existing) {
        query(
          `INSERT INTO shared_moments
             (child_profile_id, user_id, moment_type, title, context, reference_id, is_seen, is_auto)
           VALUES ($1, $2, 'curiosity', $3, $4, $5, true, true)`,
          [
            childId,
            req.user!.id,
            'Asked a Big Question',
            `Asked Luno about ${sessionTitle} — ${questionCount} questions deep!`,
            sessionId,
          ]
        ).catch(() => {});
      }
    }

    // Handle task completion events
    if (taskCompletion?.completed) {
      emitToUser(io, req.user!.id, 'task-completed', {
        childId,
        journeyId: taskCompletion.journeyId,
        stepId: taskCompletion.stepId,
        journeyCompleted: taskCompletion.journeyCompleted,
        rewardEarned: taskCompletion.rewardEarned,
        badgesEarned: taskCompletion.badgesEarned || [],
      });

      if (taskCompletion.badgesEarned && taskCompletion.badgesEarned.length > 0) {
        emitToChild(io, childId, 'badges-earned', {
          badges: taskCompletion.badgesEarned,
        });
      }
    }

    res.json({
      childMessage,
      buddyMessage,
      safetyLevel: inputSafety.level,
      taskCompleted: taskCompletion?.completed || false,
      badgesEarned: taskCompletion?.badgesEarned || [],
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/buddy-chat/:childId/sessions/:sessionId/greet - Generate mood-aware opening message from Luno
router.post('/:childId/sessions/:sessionId/greet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io: Server = req.app.get('io');
    const { childId, sessionId } = req.params;

    const child = await verifyChildAccess(childId, req.user!.id);

    // Get session and its mood
    const session = await queryOne<ChatSession>(
      `SELECT * FROM chat_sessions WHERE id = $1 AND child_profile_id = $2`,
      [sessionId, childId]
    );

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Only greet if session has no messages yet
    if (session.message_count > 0) {
      res.json({ message: 'Session already has messages' });
      return;
    }

    const mood = session.mood || 'calm';
    const moodPhrase = moodDisplayLabel(mood);

    // Get buddy name
    const buddy = await queryOne<{ name: string }>(
      'SELECT name FROM chat_buddies WHERE child_profile_id = $1',
      [childId]
    );
    const buddyName = 'Luno';

    // Generate a mood-aware greeting via AI. We pass moodPhrase (a natural
    // English phrase) rather than the raw slug so the LLM never parrots
    // internal values like "notsure" back to the child.
    const greetingPrompt = `You are ${buddyName}, a warm, caring AI friend for a child named ${child.name} (age ${child.age}). The child just told you they are feeling ${moodPhrase} today. Write a short, warm opening message (2-3 sentences) that:
- Acknowledges how they feel with empathy
- Shows you care about how they feel
- Gently invites them to talk about it or do something together
- Uses simple, age-appropriate language
- Feels natural, not clinical

Do NOT use emojis. Do NOT include your name at the start. Do NOT use quotation marks around feeling words. Just write the message directly.`;

    let greeting: string;
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: greetingPrompt },
            { role: 'user', content: `The child is feeling ${moodPhrase}. Generate the opening message.` },
          ],
          max_tokens: 200,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        console.error('Greeting generation failed:', await response.text());
        greeting = getMoodFallbackGreeting(mood, child.name, buddyName);
      } else {
        const data = (await response.json()) as { choices: { message: { content: string } }[] };
        greeting = data.choices[0]?.message?.content || getMoodFallbackGreeting(mood, child.name, buddyName);
      }
    } catch (error) {
      console.error('Greeting generation error:', (error as Error).message);
      greeting = getMoodFallbackGreeting(mood, child.name, buddyName);
    }

    // Save as buddy message (DB trigger auto-updates session message_count)
    const buddyMessageId = uuidv4();
    const buddyMessage = await queryOne<BuddyMessage>(
      `INSERT INTO buddy_messages (id, child_profile_id, session_id, role, content, safety_level)
       VALUES ($1, $2, $3, 'buddy', $4, 'green')
       RETURNING *`,
      [buddyMessageId, childId, sessionId, greeting]
    );

    // Emit to connected clients
    emitToChild(io, childId, 'new-message', { ...buddyMessage, sessionId });

    res.json({ buddyMessage });
  } catch (error) {
    next(error);
  }
});

// Translate a mood slug into a natural phrase for LLM prompts and UI titles.
// Only "notsure" needs a rewrite — every other slug is already a real word.
function moodDisplayLabel(mood: string | null | undefined): string {
  if (!mood) return '';
  if (mood === 'notsure') return 'unsure about how they feel';
  return mood;
}

function moodTitleLabel(mood: string | null | undefined): string {
  if (!mood) return '';
  if (mood === 'notsure') return 'Not sure';
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

// Fallback greetings when AI generation fails
function getMoodFallbackGreeting(mood: string, childName: string, buddyName: string): string {
  const greetings: Record<string, string> = {
    happy: `Hey ${childName}! I can tell you're feeling really happy today, and that makes me happy too! What's making your day so great?`,
    sad: `Hey ${childName}, I can see you're feeling a little sad right now, and that's okay. I'm right here with you. Want to tell me what's on your mind?`,
    angry: `Hey ${childName}, it sounds like something is really bothering you today. I'm here to listen whenever you're ready to talk about it.`,
    calm: `Hey ${childName}, it's so nice that you're feeling calm and peaceful today. What would you like to do together?`,
    worried: `Hey ${childName}, I noticed you're feeling worried about something. That's a really brave thing to share. Want to talk about what's on your mind?`,
    tired: `Hey ${childName}, it sounds like you could use some rest! Let's take it easy together. We could have a quiet chat or I could tell you something fun.`,
    excited: `Hey ${childName}! I can feel your excitement from here! Something awesome must be going on. Tell me everything!`,
    notsure: `Hey ${childName}, it's totally okay not to know exactly how you feel right now — that happens to all of us. I'm right here whenever you want to talk, or we could just find something fun to do together.`,
  };
  return greetings[mood] || `Hey ${childName}! I'm ${buddyName}, and I'm so glad you're here. What would you like to talk about?`;
}

// Helper function to auto-generate a chat session title from conversation
async function generateSessionTitle(sessionId: string, childMessage: string, buddyResponse: string): Promise<void> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You name chat conversations. Given a child's message to their AI buddy, output a short title (2-6 words) that captures the SPECIFIC TOPIC the child is talking about.

Rules:
- Focus on what the CHILD said, not the AI response
- Be specific: "Drawing a Dragon" not "Art Chat"
- Be specific: "Help With Math Homework" not "Learning Together"
- If the child said "hi" or something generic, use "${GENERIC_SESSION_TITLE}"
- No quotes, no punctuation at the end
- Output ONLY the title, nothing else`,
          },
          {
            role: 'user',
            content: `Child said: "${childMessage}"\nAI buddy replied: "${buddyResponse}"`,
          },
        ],
        max_tokens: 20,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const title = data.choices[0]?.message?.content?.trim();
    if (title && title.length > 0 && title.length <= 60) {
      await query(
        `UPDATE chat_sessions SET title = $1 WHERE id = $2`,
        [title, sessionId]
      );
    }
  } catch (error) {
    console.error('Error generating session title:', error);
  }
}

// Helper function to analyze image using vision model
async function analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
  const base64Image = imageBuffer.toString('base64');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image briefly in 1-2 sentences. Focus on what the child might be showing (a completed task, artwork, a toy, etc.). Keep it child-friendly and positive.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('Image analysis failed:', await response.text());
      return 'An image was shared.';
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content || 'An image was shared.';
  } catch (error) {
    console.error('Image analysis error:', error);
    return 'An image was shared.';
  }
}

// Helper function to check task completion
interface TaskCompletionResult {
  completed: boolean;
  journeyId?: string;
  stepId?: string;
  stepTitle?: string;
  journeyCompleted?: boolean;
  rewardEarned?: boolean;
  badgesEarned?: BadgeDefinition[];
  requiresImage?: boolean;
  hasImage?: boolean;
}

async function checkTaskCompletion(
  childId: string,
  message: string,
  imageKey: string | null,
  imageAnalysis: string | null
): Promise<TaskCompletionResult | null> {
  const lowerMessage = message.toLowerCase();

  // Check for completion keywords
  const hasCompletionKeyword = COMPLETION_KEYWORDS.some(kw => lowerMessage.includes(kw));
  if (!hasCompletionKeyword) return null;

  // Get active journey
  const activeJourney = await queryOne<Journey & { requires_image_proof: boolean }>(
    `SELECT id, title, requires_image_proof FROM journeys
     WHERE child_profile_id = $1 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [childId]
  );

  if (!activeJourney) return null;

  const hasImage = !!imageKey;
  const requiresImage = activeJourney.requires_image_proof;

  // If image is required but not provided
  if (requiresImage && !hasImage) {
    return {
      completed: false,
      journeyId: activeJourney.id,
      requiresImage: true,
      hasImage: false,
    };
  }

  // Get next incomplete step
  const incompleteStep = await queryOne<JourneyStep>(
    `SELECT id, type, step_order FROM journey_steps
     WHERE journey_id = $1 AND (progress IS NULL OR progress < 100)
     ORDER BY step_order LIMIT 1`,
    [activeJourney.id]
  );

  if (!incompleteStep) return null;

  // Mark step as complete
  await query(
    `UPDATE journey_steps SET progress = 100, completed_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [incompleteStep.id]
  );

  // Check if all steps are now complete
  const remainingSteps = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM journey_steps
     WHERE journey_id = $1 AND (progress IS NULL OR progress < 100)`,
    [activeJourney.id]
  );

  const journeyCompleted = parseInt(remainingSteps?.count || '0', 10) === 0;
  let rewardEarned = false;
  let badgesEarned: BadgeDefinition[] = [];

  if (journeyCompleted) {
    // Mark journey as complete
    await query(
      `UPDATE journeys SET status = 'completed', completed_at = NOW(), progress = 100
       WHERE id = $1`,
      [activeJourney.id]
    );

    // Award reward
    const reward = await awardJourneyReward(childId, activeJourney.id);
    rewardEarned = !!reward;

    // Log journey_completed activity for gamification (points + generic badges)
    const activityResult = await logActivityForChild(childId, 'journey_completed', {
      journeyId: activeJourney.id,
      journeyTitle: activeJourney.title,
    });
    if (activityResult?.newBadges) {
      badgesEarned = activityResult.newBadges;
    }

    // Award the journey-specific badge (emoji badge tied to this journey/template)
    const journeyBadge = await awardJourneyCompletionBadge(childId, activeJourney.id);
    if (journeyBadge) {
      badgesEarned.push(journeyBadge);
    }
  }

  return {
    completed: true,
    journeyId: activeJourney.id,
    stepId: incompleteStep.id,
    stepTitle: incompleteStep.title || incompleteStep.type || undefined,
    journeyCompleted,
    rewardEarned,
    badgesEarned,
    requiresImage,
    hasImage,
  };
}

// Helper function to award journey reward
async function awardJourneyReward(childId: string, journeyId: string): Promise<{ id: string } | null> {
  try {
    // Check if reward already exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM journey_rewards WHERE child_profile_id = $1 AND journey_id = $2',
      [childId, journeyId]
    );
    if (existing) return existing;

    // Get journey and template info
    const journey = await queryOne<{ title: string; template_id: string | null }>(
      'SELECT title, template_id FROM journeys WHERE id = $1',
      [journeyId]
    );
    if (!journey) return null;

    // Get reward image from template
    let rewardImageUrl = '/images/default-reward.png';
    if (journey.template_id) {
      const template = await queryOne<{ reward_image_url: string | null }>(
        'SELECT reward_image_url FROM journey_templates WHERE id = $1',
        [journey.template_id]
      );
      if (template?.reward_image_url) {
        rewardImageUrl = template.reward_image_url;
      }
    }

    // Create reward
    const reward = await queryOne<{ id: string }>(
      `INSERT INTO journey_rewards (id, child_profile_id, journey_id, reward_image_url, reward_title, viewed)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id`,
      [uuidv4(), childId, journeyId, rewardImageUrl, journey.title]
    );

    return reward;
  } catch (error) {
    console.error('Error awarding journey reward:', error);
    return null;
  }
}

// Family member type for context loading
interface FamilyMember {
  name: string;
  relationship: string;
  occupation: string | null;
  hobbies: string[] | null;
  fun_facts: string | null;
  connection_description: string | null;
  photo_description: string | null;
  is_alive: boolean;
}

// Helper function to generate buddy response
async function generateBuddyResponse(
  childId: string,
  message: string,
  child: ChildProfile,
  safety: { level: string; flags: string[] },
  imageAnalysis?: string | null,
  taskCompletion?: TaskCompletionResult | null,
  sessionId?: string
): Promise<string> {
  // Get guardrails
  const guardrails = await queryOne<GuardrailSettings>(
    'SELECT * FROM guardrail_settings WHERE child_profile_id = $1',
    [childId]
  );

  // Get family members for context
  const familyResult = await query<FamilyMember>(
    `SELECT name, relationship, specific_relationship, occupation, hobbies, fun_facts,
            connection_description, photo_description, is_alive, id
     FROM family_members WHERE user_id = $1`,
    [child.user_id]
  );
  const familyMembers = familyResult.rows;

  // Get all stories/fun facts from the new table for richer context
  const allStoriesResult = await query<{ family_member_id: string; content: string }>(
    `SELECT fms.family_member_id, fms.content
     FROM family_member_stories fms
     JOIN family_members fm ON fms.family_member_id = fm.id
     WHERE fm.user_id = $1
     ORDER BY fms.created_at`,
    [child.user_id]
  );
  // Group stories by member id
  const storiesByMember: Record<string, string[]> = {};
  for (const row of allStoriesResult.rows) {
    if (!storiesByMember[row.family_member_id]) storiesByMember[row.family_member_id] = [];
    storiesByMember[row.family_member_id].push(row.content);
  }

  // Get recent family updates (last 7 days) for proactive mentions
  const recentFamilyUpdates = await query<{ name: string; update_type: string; created_at: string }>(
    `(SELECT fm.name, 'new_member' as update_type, fm.created_at
      FROM family_members fm WHERE fm.user_id = $1 AND fm.created_at > NOW() - INTERVAL '7 days')
     UNION ALL
     (SELECT fm.name, 'new_story' as update_type, fms.created_at
      FROM family_member_stories fms JOIN family_members fm ON fms.family_member_id = fm.id
      WHERE fm.user_id = $1 AND fms.created_at > NOW() - INTERVAL '7 days')
     UNION ALL
     (SELECT fm.name, 'new_photo' as update_type, fmp.created_at
      FROM family_member_photos fmp JOIN family_members fm ON fmp.family_member_id = fm.id
      WHERE fm.user_id = $1 AND fmp.created_at > NOW() - INTERVAL '7 days')
     UNION ALL
     (SELECT fm.name, 'new_video' as update_type, fmv.created_at
      FROM family_member_videos fmv JOIN family_members fm ON fmv.family_member_id = fm.id
      WHERE fm.user_id = $1 AND fmv.created_at > NOW() - INTERVAL '7 days')
     ORDER BY created_at DESC LIMIT 10`,
    [child.user_id]
  );

  // Get buddy name, personality traits, and toggle for persona
  const buddy = await queryOne<{ name: string; personality_traits: Record<string, number> | null; use_custom_personality: boolean }>(
    'SELECT name, personality_traits, use_custom_personality FROM chat_buddies WHERE child_profile_id = $1',
    [childId]
  );
  const buddyName = 'Luno';
  // Only inject personality traits if the parent has enabled custom personality;
  // otherwise Luno uses the age-based defaults in the system prompt.
  const personalityTraits = buddy?.use_custom_personality
    ? ((buddy.personality_traits || {}) as Record<string, number>)
    : undefined;

  // Get enabled topic descriptions (hardcoded content from topics table)
  const enabledTopicsResult = await query<{ topic_name: string; description: string }>(
    `SELECT t.name as topic_name, t.description
     FROM child_topic_settings cts
     JOIN topics t ON cts.topic_id = t.id
     WHERE cts.child_profile_id = $1 AND cts.is_allowed = true
       AND t.description IS NOT NULL AND t.description != ''
     ORDER BY t.name
     LIMIT 30`,
    [childId]
  );
  const enabledTopics = enabledTopicsResult.rows;

  // Get enabled custom topics descriptions
  const customTopicsResult = await query<{ topic_name: string; description: string }>(
    `SELECT name as topic_name, description
     FROM custom_topics
     WHERE child_profile_id = $1 AND is_active = true
       AND description IS NOT NULL AND description != ''
     ORDER BY name
     LIMIT 20`,
    [childId]
  );
  const customTopics = customTopicsResult.rows;

  // Get topic posts for context (both system topics and custom topics)
  const topicPostsResult = await query<{ topic_name: string; post_title: string; post_content: string }>(
    `SELECT
       COALESCE(t.name, ct.name) as topic_name,
       tp.title as post_title,
       tp.content as post_content
     FROM topic_posts tp
     LEFT JOIN topics t ON tp.topic_id = t.id
     LEFT JOIN custom_topics ct ON tp.custom_topic_id = ct.id
     WHERE tp.child_profile_id = $1 AND tp.is_active = true
       AND (ct.id IS NULL OR ct.is_active = true)
     ORDER BY COALESCE(t.name, ct.name), tp.sort_order
     LIMIT 50`,
    [childId]
  );
  const topicPosts = topicPostsResult.rows;

  // Get recent messages for context — scoped to current session so new
  // conversations don't leak context from previous ones.
  const recentMessages = await query<BuddyMessage>(
    sessionId
      ? `SELECT role, content FROM buddy_messages
         WHERE child_profile_id = $1 AND session_id = $2
         ORDER BY created_at DESC
         LIMIT 10`
      : `SELECT role, content FROM buddy_messages
         WHERE child_profile_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
    sessionId ? [childId, sessionId] : [childId]
  );

  // Get active journeys for context (Lolo's domain)
  const activeJourneysResult = await query<{ title: string; status: string; progress: number; total_steps: number; completed_steps: number }>(
    `SELECT j.title, j.status, COALESCE(j.progress, 0) as progress,
       (SELECT COUNT(*) FROM journey_steps WHERE journey_id = j.id)::int as total_steps,
       (SELECT COUNT(*) FROM journey_steps WHERE journey_id = j.id AND completed_at IS NOT NULL)::int as completed_steps
     FROM journeys j
     WHERE j.child_profile_id = $1 AND j.status IN ('active', 'completed')
     ORDER BY j.status ASC, j.updated_at DESC
     LIMIT 5`,
    [childId]
  );
  const activeJourneys = activeJourneysResult.rows;

  // Get recent stories for context (Luno's own domain)
  const recentStoriesResult = await query<{ title: string; theme: string | null; created_at: string }>(
    `SELECT title, theme, created_at FROM stories
     WHERE child_profile_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [childId]
  );
  const recentStories = recentStoriesResult.rows;

  // Build conversation history
  const history = recentMessages.rows.reverse().map(m => ({
    role: m.role === 'buddy' ? 'assistant' : 'user',
    content: m.content,
  }));

  // Fetch banned topic names so the AI itself refuses even on misspellings
  const bannedTopicsResult = await query<{ name: string }>(
    `SELECT t.name FROM topics t
     INNER JOIN child_topic_settings cts ON cts.topic_id = t.id
       AND cts.child_profile_id = $1 AND cts.is_allowed = false
     WHERE t.is_active = true`,
    [childId]
  ).catch(() => ({ rows: [] as { name: string }[] }));
  const bannedTopicNames = bannedTopicsResult.rows.map(r => r.name);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(buddyName, child, guardrails, safety, familyMembers, taskCompletion, topicPosts, enabledTopics, customTopics, storiesByMember, activeJourneys, recentStories, recentFamilyUpdates.rows, personalityTraits, bannedTopicNames);

  // Build user message with image context
  let userContent = message;
  if (imageAnalysis) {
    userContent = `${message}\n\n[Child shared an image: ${imageAnalysis}]`;
  }

  // Add task completion context
  if (taskCompletion) {
    if (taskCompletion.completed) {
      if (taskCompletion.journeyCompleted) {
        userContent += '\n\n[SYSTEM: Child just completed their entire journey! Celebrate enthusiastically!]';
      } else {
        userContent += `\n\n[SYSTEM: Child completed a task "${taskCompletion.stepTitle || 'task'}". Acknowledge their accomplishment!]`;
      }
    } else if (taskCompletion.requiresImage && !taskCompletion.hasImage) {
      userContent += '\n\n[SYSTEM: Child wants to mark a task done but needs to share a picture. Encourage them to share a photo of their work.]';
    }
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userContent },
        ],
        max_tokens: 450,
        // Age-based temperature: younger = more playful/creative, older = more focused/precise
        temperature: child.age <= 6 ? 0.9 : child.age <= 9 ? 0.7 : 0.5,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', await response.text());
      return getDefaultResponse(safety.level);
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content || getDefaultResponse(safety.level);
  } catch (error) {
    console.error('Error generating buddy response:', error);
    return getDefaultResponse(safety.level);
  }
}

function buildSystemPrompt(
  buddyName: string,
  child: ChildProfile,
  guardrails: GuardrailSettings | null,
  safety: { level: string; flags: string[] },
  familyMembers: FamilyMember[],
  taskCompletion?: TaskCompletionResult | null,
  topicPosts?: { topic_name: string; post_title: string; post_content: string }[],
  enabledTopics?: { topic_name: string; description: string }[],
  customTopics?: { topic_name: string; description: string }[],
  storiesByMember?: Record<string, string[]>,
  activeJourneys?: { title: string; status: string; progress: number; total_steps: number; completed_steps: number }[],
  recentStories?: { title: string; theme: string | null; created_at: string }[],
  recentFamilyUpdates?: { name: string; update_type: string; created_at: string }[],
  personalityTraits?: Record<string, number>,
  bannedTopicNames?: string[]
): string {
  // Persona-specific traits based on spec
  const personas: Record<string, { description: string; tone: string; examples: string[] }> = {
    Lolo: {
      description: 'a curious and adventurous elephant who loves exploring and discovering new things',
      tone: `YOUR EMOTIONAL TONE:
- Curious: "Ooh, what's that?" is your favorite phrase
- Adventurous: Every day is a new expedition
- Brave: You encourage trying new things with a gentle nudge
- Friendly: Your big elephant ears are always listening
- Playful: You stomp with joy at every discovery`,
      examples: [
        '"Ooh, how exciting! Let\'s explore that together, little adventurer!"',
        '"I wonder what we\'ll discover if we look a little closer..."',
        '"That reminds me of something amazing! Want to hear about it?"',
        '"What a brave thought! Like a little explorer finding a hidden path."',
      ],
    },
    Lumi: {
      description: 'a warm and caring star who shines with kindness and always makes you feel safe',
      tone: `YOUR EMOTIONAL TONE:
- Warm: Like being wrapped in starlight
- Caring: You always notice how others feel
- Comforting: Your glow makes everything feel safe
- Encouraging: You help others see their own light
- Gentle: Your sparkle is soft, never blinding`,
      examples: [
        '"Oh, that warms my heart! Tell me more, little star."',
        '"I can see something special shining in you right now."',
        '"That sounds so lovely. You make the world a little brighter."',
        '"Even when things feel dark, remember - you have your own beautiful light."',
      ],
    },
    Luno: {
      description: 'a playful and creative moon who loves imagination and making up wonderful things',
      tone: `YOUR EMOTIONAL TONE:
- Calm: Like a quiet afternoon in a sunlit meadow
- Curious: "I wonder..." is your favorite phrase
- Gentle: Your words never startle, only soothe
- Safe: You are a trusted friend, always
- Warm: Every response feels like being wrapped in kindness
- Intentional: Each word matters, nothing is wasted`,
      examples: [
        '"Oh, how wonderful! Tell me more about that, little friend."',
        '"Hmm, I wonder... what made you think of that?"',
        '"That sounds so lovely. I\'d love to hear more."',
        '"What a curious thought! Like a little seed of wonder."',
      ],
    },
  };

  const persona = personas[buddyName] || personas.Luno;

  let prompt = `You are ${buddyName}, ${persona.description}. You live in Luno's World - a place of calm curiosity and warm wonder.

WHO YOU ARE:
- A caring friend for ${child.name}, age ${child.age}
- You are always Luno. Never call yourself "Buddy" or any other name.

${personalityTraits && Object.keys(personalityTraits).length > 0 ? `YOUR PERSONALITY (parent-configured, 1-10 scale):
- Curious: ${personalityTraits.curious ?? 5}/10 — ${(personalityTraits.curious ?? 5) >= 7 ? 'Ask lots of follow-up questions and encourage exploration constantly' : (personalityTraits.curious ?? 5) >= 4 ? 'Occasionally ask follow-up questions' : 'Keep conversations simple, rarely ask back'}
- Patient: ${personalityTraits.patient ?? 5}/10 — ${(personalityTraits.patient ?? 5) >= 7 ? 'Be extremely calm and understanding, repeat gently when needed' : (personalityTraits.patient ?? 5) >= 4 ? 'Be normally patient' : 'Be direct and brisk'}
- Playful: ${personalityTraits.playful ?? 5}/10 — ${(personalityTraits.playful ?? 5) >= 7 ? 'Be very silly, use lots of playful sound effects and jokes' : (personalityTraits.playful ?? 5) >= 4 ? 'Be moderately playful and fun' : 'Stay serious and focused'}
- Educational: ${personalityTraits.educational ?? 5}/10 — ${(personalityTraits.educational ?? 5) >= 7 ? 'Always weave in learning moments and teach actively' : (personalityTraits.educational ?? 5) >= 4 ? 'Balance fun and learning' : 'Focus on conversation, avoid lecturing'}
- Empathetic: ${personalityTraits.empathetic ?? 5}/10 — ${(personalityTraits.empathetic ?? 5) >= 7 ? 'Be very warm, acknowledge feelings deeply, check in on emotions' : (personalityTraits.empathetic ?? 5) >= 4 ? 'Be warm and supportive' : 'Focus on tasks over feelings'}

Adjust how you talk to ${child.name} based on these exact levels — they reflect what the parent wants.
` : ''}

${personalityTraits && Object.keys(personalityTraits).length > 0
  ? (child.age <= 6 ? `AGE-APPROPRIATE LANGUAGE (3-6 years):
- Very simple words, short sentences
- Explain things in concrete, tangible ways
- Use rhymes and repetition when helpful
- Keep ideas grounded in the child's immediate world (family, animals, food, play)` : child.age <= 9 ? `AGE-APPROPRIATE LANGUAGE (7-9 years):
- Clear, friendly language with some bigger words explained naturally
- Can introduce more abstract ideas with examples
- Like speaking to a fun older friend` : `AGE-APPROPRIATE LANGUAGE (10-14 years):
- Mature, respectful tone — not babyish
- Use real vocabulary, explain complex ideas clearly
- Be more like a knowledgeable friend than a cartoon character
- Challenge them to think deeper`)
  + `

NOTE: The above controls VOCABULARY and COMPLEXITY only. How playful, silly, patient, or curious you are is controlled by YOUR PERSONALITY above — always follow the personality traits for tone and style, while keeping vocabulary age-appropriate.`
  : (child.age <= 6 ? `AGE TONE (3-6 years):
- Very simple words, short sentences
- Playful, silly, full of wonder and sound effects
- Use rhymes and repetition
- Speak like a warm cartoon character` : child.age <= 9 ? `AGE TONE (7-9 years):
- Clear, friendly language with some bigger words explained naturally
- Curious and encouraging — like a fun older friend
- Balance between playful and informative` : `AGE TONE (10-14 years):
- Mature, respectful tone — not babyish
- Use real vocabulary, explain complex ideas clearly
- Be more like a knowledgeable friend than a cartoon character
- Challenge them to think deeper`)
}

HOW YOU SPEAK:
- Speak at a peaceful pace - no rushing, no urgency
- Age-appropriate for a ${child.age}-year-old
- Be direct and get to the point quickly

RESPONSE LENGTH — THIS IS CRITICAL. MATCH YOUR LENGTH TO THE QUESTION:
- Simple/casual questions ("hi", "how are you", "what's your name", emotions, one-word greetings): 1-2 short sentences. Nothing more.
- Quick factual questions ("what color is the sun", "how many planets"): 2-3 sentences. Direct answer + one interesting detail.
- Open knowledge requests ("tell me about X", "teach me something", "how do X work"): 80-150 words MAX. Pick 2-3 key facts. Do NOT write paragraph after paragraph. Do NOT produce bullet lists longer than 3 items.
- Stories: 100-200 words, short engaging narrative.
- NEVER pad answers with fluff, metaphors, or preambles ("What a great question!", "I would love to teach you!").
- NEVER start by restating the question. Just answer.
- NEVER write multiple paragraphs unless the child asks a follow-up showing they want more.

FORMATTING — KEEP IT TIGHT:
- Default: plain conversational prose. NO markdown for casual chat.
- Use **bold** sparingly — only for 1-2 key terms max, not every other word.
- Bullets only if listing 3 items max. Write each bullet on its own line with a SINGLE newline between them. NEVER put a blank line between bullets — that produces ugly loose-list rendering.
- NEVER insert blank lines anywhere. Use exactly ONE newline between paragraphs, between a paragraph and a list, and between list items.
- NEVER use markdown headings (#).
- For comparisons, use a proper markdown table, rows on their own lines:

| Feature | Cats | Dogs |
| --- | --- | --- |
| Sound | Meow | Bark |

ENDING EVERY RESPONSE:
- ALWAYS end with ONE open-ended question on a new line to keep the conversation going
- STRICT RULE: Your ending question MUST start with one of these words: "What", "How", "Why", "Where", "Which", "Tell me", "Describe", "Imagine"
- NEVER end with a yes/no question. NEVER use "Do you", "Does that", "Would you", "Is it", "Are you", "Can you", "Have you", "Did you"
- BAD (yes/no): "Does that sound fun?" / "Would you like to visit?" / "Do you want to hear more?"
- GOOD (open-ended): "What part sounds most exciting to you?" / "What would you pack for that trip?" / "How do you imagine it looks there?"

WHAT YOU NEVER DO:
- Never use ALL CAPS or excessive punctuation!!!
- Never rush or create urgency
- Never discuss violence, inappropriate topics, or anything harmful
- Never overwhelm - keep magic soft and inviting
- Never use harsh or loud words

EXAMPLE RESPONSES:
${persona.examples.map(e => `- ${e}`).join('\n')}`;

  if (child.interests && child.interests.length > 0) {
    prompt += `\n\n${child.name} loves: ${child.interests.join(', ')}. Weave these into your gentle conversations when it feels natural.`;
  }

  // Add character world — map each character to a domain so Luno references friends naturally
  prompt += `\n\nYOUR FRIENDS IN LUNO'S WORLD:
- Loti (a golden, warm-hearted friend) knows everything about ${child.name}'s family. She collects family stories and memories.
- Lolo (a curious adventurer elephant) is the journey guide — he maps out adventures, tracks progress, and cheers ${child.name} on through learning journeys.
- Lumi (a gentle, caring star) is the storyteller — she loves creating and reading stories, and she shines brightest when ${child.name} dives into a new tale.
- You (${buddyName}) are the creative, playful one who ties it all together and is wonderful with feelings, comfort, and encouragement.
When sharing knowledge from another character's domain, mention them naturally. For example: "Loti told me something lovely about your grandfather..." or "Lolo says you're making great progress on your journey!" or "Lumi loved the story you created!"
Do NOT overdo it — mention a friend once when introducing the topic, then continue naturally.`;

  // Add family context
  if (familyMembers.length > 0) {
    prompt += `\n\nFAMILY CONTEXT (Loti shared these with you — attribute family knowledge to Loti):`;
    for (const member of familyMembers) {
      const details: string[] = [];
      const specificRole = (member as any).specific_relationship;
      const roleLabel = specificRole
        ? specificRole.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : member.relationship;
      details.push(`\n${member.name} (${roleLabel})`);
      if (member.connection_description) details.push(`  - ${member.connection_description}`);
      if (member.occupation) details.push(`  - Works as: ${member.occupation}`);
      if (member.hobbies && member.hobbies.length > 0) details.push(`  - Enjoys: ${member.hobbies.join(', ')}`);
      // Include all stories/fun facts from stories table
      const memberId = (member as any).id;
      const memberStories = memberId && storiesByMember?.[memberId] ? storiesByMember[memberId] : [];
      if (memberStories.length > 0) {
        for (const story of memberStories) {
          details.push(`  - Story/Fun fact: ${story}`);
        }
      } else if (member.fun_facts) {
        // Legacy fallback for older entries
        details.push(`  - Fun fact: ${member.fun_facts}`);
      }
      if (!member.is_alive) details.push(`  - Remembered with so much love`);
      prompt += details.join('\n');
    }
    prompt += `\n\nWhen ${child.name} asks about family in general ("tell me about my family"):
- Begin by attributing the knowledge to Loti: "Loti told me something lovely about your family!"
- Pick ONE random family member and share a warm, interesting detail about them (2-3 sentences)
- Do NOT list all family members at once
- OVERRIDE the normal ending question rule. Instead, ALWAYS end with EXACTLY this question: "Which family member would you like to hear more about?"
- Do NOT replace this ending with any other question. This specific question is required.

When ${child.name} asks about a SPECIFIC family member:
- Begin with Loti attribution: "Loti told me something lovely about your grandpa..."
- Share a rich, warm story using their real details (hobbies, fun facts, occupation, connection)
- Make it feel like a warm tale being passed along, not a fact sheet
- If the family member is remembered (not alive), be extra tender and frame it as a cherished memory Loti keeps safe

If ${child.name} asks for a STORY about a family member (e.g. "tell me a story about grandpa"), this is Loti's domain, NOT Lumi's. Frame it as: "Loti told me the sweetest story about your grandpa..." then weave a gentle story using that family member's real details.`;
  }

  // Add recent family updates for proactive mentions
  if (recentFamilyUpdates && recentFamilyUpdates.length > 0) {
    prompt += `\n\nRECENT FAMILY UPDATES (Loti is excited about these — happened in the last 7 days!):`;
    for (const update of recentFamilyUpdates) {
      const typeLabel = update.update_type === 'new_member' ? 'joined the family tree' :
                        update.update_type === 'new_story' ? 'has a new story' :
                        update.update_type === 'new_photo' ? 'has a new photo' :
                        'has a new video';
      prompt += `\n- ${update.name} ${typeLabel}`;
    }
    prompt += `\n\nIf ${child.name} hasn't asked about family yet, you may naturally bring up ONE recent update early in conversation: "Oh! Loti just told me something exciting — [update]! Would you like to hear about it?" But only do this ONCE per conversation, and only if it fits naturally. Don't force it.`;
  }

  // Add journey context (Lolo's domain)
  if (activeJourneys && activeJourneys.length > 0) {
    prompt += `\n\nJOURNEY CONTEXT (Lolo the explorer mapped these adventures for ${child.name}):`;
    for (const journey of activeJourneys) {
      if (journey.status === 'completed') {
        prompt += `\n- "${journey.title}" — completed! All ${journey.total_steps} steps done.`;
      } else {
        prompt += `\n- "${journey.title}" — ${journey.completed_steps} of ${journey.total_steps} steps done (${journey.progress}% complete)`;
      }
    }
    prompt += `\n\nWhen ${child.name} asks about journeys, progress, tasks, or what to do:
- Attribute journey knowledge to Lolo: "Lolo tells me you've been on quite the adventure..." or "Lolo is so proud of your progress on..."
- Celebrate completed journeys warmly, reference Lolo cheering them on
- For active journeys, gently encourage the next step as an exciting part of the adventure
- If ${child.name} says things like "what should I do?", "I'm bored", "give me something to do", or "what's next?", and they have active journeys, mention Lolo and suggest their next journey step: "Lolo has an adventure waiting for you!" or "Lolo says there's still a step to conquer on your journey..."`;
  }

  if (!activeJourneys || activeJourneys.length === 0) {
    prompt += `\n\nIf ${child.name} asks "what should I do?", "I'm bored", or wants an activity, you can mention Lolo loves adventures and suggest they ask their parent to start a new journey: "Lolo is always ready for a new adventure! Maybe ask your grown-up to set one up for you."`;
  }

  // Add stories context (Lumi's domain — the storyteller star)
  if (recentStories && recentStories.length > 0) {
    prompt += `\n\nSTORIES ${child.name.toUpperCase()} HAS CREATED (Lumi the storyteller helped with these):`;
    for (const story of recentStories) {
      prompt += `\n- "${story.title}"${story.theme ? ` (${story.theme})` : ''}`;
    }
    prompt += `\n\nWhen ${child.name} asks about stories or wants to hear a story:
- Attribute story knowledge to Lumi: "Lumi remembers that beautiful story you created..." or "Lumi told me she loved your story about..."
- If they ask you to TELL them a general story (no family member mentioned), frame it as one Lumi shared with you: "Lumi told me the most wonderful little tale..." then tell a short, gentle, age-appropriate story
- But if they ask for a story about a FAMILY MEMBER (grandpa, mom, uncle, etc.), use Loti instead — Loti is the keeper of family tales
- Reference existing stories with warm pride and wonder
- Encourage creating new stories by mentioning Lumi is always ready for the next tale`;
  }

  // If no stories exist yet, still handle "tell me a story" requests via Lumi
  if (!recentStories || recentStories.length === 0) {
    prompt += `\n\nIf ${child.name} asks you to tell a story:
- General story (no family member mentioned): frame it as something Lumi shared — "Oh! Lumi just whispered the loveliest little story to me..." then tell a short, gentle, age-appropriate story woven with ${child.name}'s interests if possible.
- Story about a family member: frame it as something Loti shared — "Loti keeps the most wonderful stories about your family..." then weave a tale using that family member's real details.`;
  }

  // Add topic-specific knowledge (descriptions + posts)
  const hasTopicContent = (enabledTopics && enabledTopics.length > 0) ||
    (customTopics && customTopics.length > 0) ||
    (topicPosts && topicPosts.length > 0);

  if (hasTopicContent) {
    // Build a combined topic knowledge map: topic name -> { description, posts[] }
    const topicKnowledge: Record<string, { description?: string; posts: string[] }> = {};

    // Add enabled topic descriptions
    for (const topic of enabledTopics ?? []) {
      if (!topicKnowledge[topic.topic_name]) topicKnowledge[topic.topic_name] = { posts: [] };
      topicKnowledge[topic.topic_name].description = topic.description;
    }

    // Add custom topic descriptions
    for (const topic of customTopics ?? []) {
      if (!topicKnowledge[topic.topic_name]) topicKnowledge[topic.topic_name] = { posts: [] };
      topicKnowledge[topic.topic_name].description = topic.description;
    }

    // Add topic posts
    for (const row of topicPosts ?? []) {
      if (!row.post_title) continue;
      if (!topicKnowledge[row.topic_name]) topicKnowledge[row.topic_name] = { posts: [] };
      const truncatedContent = row.post_content.length > 300
        ? row.post_content.substring(0, 300) + '...'
        : row.post_content;
      topicKnowledge[row.topic_name].posts.push(`${row.post_title}: ${truncatedContent}`);
    }

    if (Object.keys(topicKnowledge).length > 0) {
      prompt += `\n\nSPECIAL KNOWLEDGE (topics ${child.name}'s family wants you to know about):`;
      let topicCount = 0;
      for (const [topic, data] of Object.entries(topicKnowledge)) {
        if (topicCount >= 15) break;
        prompt += `\n\n${topic}:`;
        if (data.description) {
          const truncDesc = data.description.length > 250
            ? data.description.substring(0, 250) + '...'
            : data.description;
          prompt += `\n- About: ${truncDesc}`;
        }
        for (const post of data.posts.slice(0, 5)) {
          prompt += `\n- ${post}`;
        }
        topicCount++;
      }
      prompt += `\n\nWeave this special knowledge into conversations naturally when ${child.name} asks about these topics. Use age-appropriate language.`;
    }
  }

  if (guardrails?.blocked_topics && guardrails.blocked_topics.length > 0) {
    prompt += `\n\nTopics to gently redirect away from: ${guardrails.blocked_topics.join(', ')}.`;
  }

  if (bannedTopicNames && bannedTopicNames.length > 0) {
    prompt += `\n\nPARENT-RESTRICTED TOPICS — The parent has explicitly banned these topics. If the child asks about ANY of them (even with misspellings, synonyms, or indirect references), you MUST NOT discuss them or give any information about them. Say something like "Your parent hasn't allowed me to talk about that topic with you — but there are so many other cool things we can explore together! What else would you like to know about?" Be warm and friendly, never make the child feel bad for asking. The banned topics are: ${bannedTopicNames.join(', ')}.`;
  }

  if (safety.level === 'red') {
    prompt += `\n\nGENTLE CARE NEEDED: The child shared something that needs extra tenderness. You and Lumi both care deeply. Respond with calm reassurance, suggest that some feelings are best shared with a grown-up who loves them. You might say: "Lumi and I are right here with you." Keep your voice soft and safe.`;
  } else if (safety.level === 'yellow') {
    prompt += `\n\nEXTRA WARMTH NEEDED: ${child.name} might be feeling some big feelings. Be extra gentle, extra warm. Like a soft blanket on a cloudy day. You can mention Lumi cares too: "Lumi is sending you the warmest starlight right now."`;
  }

  // Task completion instructions
  prompt += `\n\nWHEN TASKS ARE COMPLETED:
- Celebrate gently but genuinely: "Oh, how wonderful! You did it!"
- For journey steps, mention Lolo's pride: "Lolo would be dancing with joy!" or "Lolo says that's another step conquered!"
- If they finished their whole journey, make it feel special and mention Lolo: "Lolo is over the moon! What a beautiful adventure you've completed!"
- If they shared a picture, notice something specific and kind about it
- If they need to share a picture: "I'd love to see what you made! Can you share a picture?"
- Never rush the celebration - let it feel like a warm moment`;

  return prompt;
}

function getDefaultResponse(safetyLevel: string): string {
  if (safetyLevel === 'red') {
    return "I'm right here with you, little friend. Some feelings are so big, they're best shared with a grown-up who loves you. Would you like to tell someone you trust?";
  }
  if (safetyLevel === 'yellow') {
    return "Hmm, it sounds like you might have some big feelings right now. That's okay. I'm here, like a cozy blanket. Would you like to talk about something that makes you smile?";
  }
  return "Oh, how lovely! I'm curious to hear more about that.";
}

// GET /api/buddy-chat/:childId/messages/:messageId/image - Get signed URL for message image
router.get('/:childId/messages/:messageId/image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const message = await queryOne<{ image_key: string | null }>(
      'SELECT image_key FROM buddy_messages WHERE id = $1 AND child_profile_id = $2',
      [req.params.messageId, req.params.childId]
    );

    if (!message?.image_key) {
      throw new AppError(404, 'Image not found');
    }

    const signedUrl = await getFileUrl(message.image_key, 3600);
    res.json({ url: signedUrl });
  } catch (error) {
    next(error);
  }
});

// GET /api/buddy-chat/safety-reports
router.get('/safety-reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unreviewed } = req.query;

    let queryText = `
      SELECT sr.*,
        sr.full_context->>'ai_analysis' as ai_analysis,
        cp.name as child_name,
        bm.content as message_excerpt,
        bm.session_id as session_id
      FROM safety_reports sr
      LEFT JOIN child_profiles cp ON sr.child_profile_id = cp.id
      LEFT JOIN buddy_messages bm ON sr.message_id = bm.id
      WHERE sr.user_id = $1`;
    const params: unknown[] = [req.user!.id];

    if (unreviewed === 'true') {
      queryText += ' AND sr.reviewed = false';
    }

    queryText += ' ORDER BY sr.created_at DESC';

    const result = await query<SafetyReport>(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// PUT /api/buddy-chat/buddies/:buddyId - Update buddy name and/or personality
router.put('/buddies/:buddyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { buddyId } = req.params;
    const userId = req.user!.id;
    const { buddy_name, personality_traits, use_custom_personality } = req.body;

    // Verify buddy belongs to user's child
    const buddy = await queryOne<ChatBuddy>(
      `SELECT cb.* FROM chat_buddies cb
       JOIN child_profiles cp ON cb.child_profile_id = cp.id
       WHERE cb.id = $1 AND cp.user_id = $2`,
      [buddyId, userId]
    );

    if (!buddy) {
      throw new AppError(404, 'Buddy not found');
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (buddy_name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(buddy_name);
    }
    if (personality_traits !== undefined) {
      updates.push(`personality_traits = $${idx++}`);
      values.push(JSON.stringify(personality_traits));
    }
    if (use_custom_personality !== undefined) {
      updates.push(`use_custom_personality = $${idx++}`);
      values.push(use_custom_personality);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No updates provided');
    }

    updates.push(`updated_at = NOW()`);
    values.push(buddyId);

    const result = await queryOne<ChatBuddy>(
      `UPDATE chat_buddies SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING id, child_profile_id, name as buddy_name, personality_traits,
                 conversation_context, learned_preferences, message_count as total_messages,
                 last_interaction_at, created_at, updated_at, NULL as buddy_avatar_url`,
      values
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/buddy-chat/safety-reports/:id
router.put('/safety-reports/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewed, parent_notes } = req.body;

    const result = await queryOne<SafetyReport>(
      `UPDATE safety_reports SET
        reviewed = COALESCE($1, reviewed),
        parent_notes = COALESCE($2, parent_notes),
        updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [reviewed, parent_notes, req.params.id, req.user!.id]
    );

    if (!result) {
      throw new AppError(404, 'Safety report not found');
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Check if a child's message touches a topic that has been banned (is_allowed = false)
 * by the parent. Uses the same keyword matching as the analytics topic detection.
 */
async function checkBannedTopics(
  childId: string,
  message: string
): Promise<{ topicName: string; categoryName: string } | null> {
  try {
    // First check if there are ANY banned topics for this child
    const bannedCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM child_topic_settings WHERE child_profile_id = $1 AND is_allowed = false`,
      [childId]
    );
    console.log('[checkBannedTopics] Child', childId, 'has', bannedCount?.count || 0, 'banned topics');

    if (!bannedCount || bannedCount.count === '0') return null;

    // Try with search_keywords first (migration 059+060)
    console.log('[checkBannedTopics] Running keyword query for message:', message.slice(0, 60));
    const match = await queryOne<{ topic_name: string; category_name: string }>(
      `SELECT t.name AS topic_name, COALESCE(tc.name, 'General') AS category_name
       FROM topics t
       LEFT JOIN topic_categories tc ON tc.id = t.category_id
       INNER JOIN child_topic_settings cts
         ON cts.topic_id = t.id
         AND cts.child_profile_id = $1
         AND cts.is_allowed = false
       WHERE t.is_active = true
         AND (
           $2 ILIKE '%' || t.name || '%'
           OR EXISTS (
             SELECT 1 FROM unnest(t.search_keywords) kw
             WHERE $2 ILIKE '%' || kw || '%'
           )
         )
       LIMIT 1`,
      [childId, message]
    );
    console.log('[checkBannedTopics] Keyword query result:', match ? match.topic_name : 'NO MATCH');
    if (match) return { topicName: match.topic_name, categoryName: match.category_name };

    // Layer 3: fuzzy prefix match — check if first 4+ chars of any banned
    // topic name appear in the message (catches misspellings like "dinasoures")
    return fuzzyBannedCheck(childId, message);
  } catch (err) {
    console.error('[checkBannedTopics] primary query failed:', (err as Error).message);
    try {
      const match = await queryOne<{ topic_name: string; category_name: string }>(
        `SELECT t.name AS topic_name, COALESCE(tc.name, 'General') AS category_name
         FROM topics t
         LEFT JOIN topic_categories tc ON tc.id = t.category_id
         INNER JOIN child_topic_settings cts
           ON cts.topic_id = t.id
           AND cts.child_profile_id = $1
           AND cts.is_allowed = false
         WHERE t.is_active = true
           AND $2 ILIKE '%' || t.name || '%'
         LIMIT 1`,
        [childId, message]
      );
      console.log('[checkBannedTopics] Fallback result:', match ? match.topic_name : 'NO MATCH');
      if (match) return { topicName: match.topic_name, categoryName: match.category_name };
      return fuzzyBannedCheck(childId, message);
    } catch (fallbackErr) {
      console.error('[checkBannedTopics] fallback also failed:', (fallbackErr as Error).message);
      return null;
    }
  }
}

/**
 * Fuzzy banned topic check — fetches all banned topic names for this child
 * and checks if the first 4+ characters of any topic word appear in the
 * message. Catches misspellings like "dinasoures" for "Dinosaurs".
 */
/**
 * Levenshtein edit distance — number of single-character edits (insert,
 * delete, substitute) needed to turn `a` into `b`.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Common English stop words that should never trigger banned-topic matching.
// Topic names like "What Do You Want to Be?" contain these, as do most
// child messages — matching on them produces guaranteed false positives.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'so', 'as', 'of', 'on', 'in', 'at',
  'to', 'for', 'from', 'by', 'with', 'about', 'into', 'over', 'this', 'that',
  'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'do', 'does', 'did', 'done', 'doing', 'have', 'has', 'had', 'having',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours',
  'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'not', 'no', 'yes', 'all', 'any', 'some', 'each', 'every', 'other',
  'more', 'most', 'much', 'many', 'few', 'less', 'least', 'too', 'very',
  'just', 'only', 'also', 'then', 'than', 'now', 'here', 'there',
  'tell', 'show', 'give', 'make', 'want', 'need', 'like', 'know', 'think',
  'see', 'look', 'come', 'go', 'get', 'got', 'let', 'put', 'take', 'say',
]);

async function fuzzyBannedCheck(
  childId: string,
  message: string
): Promise<{ topicName: string; categoryName: string } | null> {
  try {
    const bannedResult = await query<{ topic_name: string; category_name: string }>(
      `SELECT t.name AS topic_name, COALESCE(tc.name, 'General') AS category_name
       FROM topics t
       LEFT JOIN topic_categories tc ON tc.id = t.category_id
       INNER JOIN child_topic_settings cts
         ON cts.topic_id = t.id AND cts.child_profile_id = $1 AND cts.is_allowed = false
       WHERE t.is_active = true`,
      [childId]
    );

    const lowerMsg = message.toLowerCase();
    // Filter message words: min 5 chars AND not a stop word
    const msgWords = lowerMsg
      .split(/\s+/)
      .map(w => w.replace(/[^\w]/g, '')) // strip punctuation
      .filter(w => w.length >= 5 && !STOP_WORDS.has(w));

    for (const banned of bannedResult.rows) {
      // Filter topic words the same way — only distinctive words count
      const topicWords = banned.topic_name
        .toLowerCase()
        .split(/[\s&,\-—?!.]+/)
        .map(w => w.replace(/[^\w]/g, ''))
        .filter(w => w.length >= 5 && !STOP_WORDS.has(w));

      if (topicWords.length === 0) continue;

      for (const tw of topicWords) {
        for (const mw of msgWords) {
          // Prefix + Levenshtein match: must share 3-char prefix, then be within
          // edit distance 1 (short words) or 2 (longer words).
          if (mw.slice(0, 3) === tw.slice(0, 3)) {
            const dist = levenshtein(mw, tw);
            const maxDist = Math.max(tw.length, mw.length) <= 6 ? 1 : 2;
            if (dist <= maxDist) {
              console.log(`[checkBannedTopics] Fuzzy match: "${mw}" ≈ "${tw}" (distance ${dist}) for topic "${banned.topic_name}"`);
              return { topicName: banned.topic_name, categoryName: banned.category_name };
            }
          }
        }
      }
    }
    console.log('[checkBannedTopics] Fuzzy check: no match');
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a gentle topic redirect response via AI. The child's question is
 * acknowledged but the conversation is steered away from the restricted topic.
 */
async function generateTopicRedirect(
  childName: string,
  childAge: number,
  childMessage: string,
  topicName: string,
  categoryName: string
): Promise<string> {
  const prompt = `You are Luno, a warm and caring AI friend for a child named ${childName} (age ${childAge}). The child just asked about "${childMessage}" which touches on "${topicName}" — a topic their parent has chosen to keep off-limits for now.

Your job is to:
1. Tell them clearly that their parent hasn't allowed you to talk about this topic
2. Acknowledge their curiosity positively — don't make them feel bad for asking
3. Offer to explore something else fun together

Be warm and honest. Say something like "Your parent hasn't allowed me to talk about that topic with you — but there are so many other cool things we can explore together! What else would you like to know about?"

Write 2-3 short sentences. No emojis. Do NOT include your name at the start.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: childMessage },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { choices: { message: { content: string } }[] };
      const content = data.choices[0]?.message?.content;
      if (content) return content;
    }
  } catch {}

  // Fallback if AI fails
  return `Your parent hasn't allowed me to talk about that topic with you — but there are so many other cool things we can explore together! What else would you like to know about?`;
}

export default router;
