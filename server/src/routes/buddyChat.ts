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

  // Check red flags first (most serious)
  for (const keyword of RED_FLAG_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      flags.push(keyword);
    }
  }

  if (flags.length > 0) {
    return { level: 'red', flags };
  }

  // Check yellow flags
  for (const keyword of YELLOW_FLAG_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
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
      `SELECT id, child_profile_id, name as buddy_name, personality_traits,
              conversation_context, learned_preferences, message_count as total_messages,
              last_interaction_at, created_at, updated_at, NULL as buddy_avatar_url
       FROM chat_buddies WHERE child_profile_id = $1`,
      [req.params.childId]
    );

    // Auto-create buddy if doesn't exist
    if (!buddy) {
      const id = uuidv4();
      buddy = await queryOne<ChatBuddy>(
        `INSERT INTO chat_buddies (id, child_profile_id, name, message_count)
         VALUES ($1, $2, 'Luno', 0)
         RETURNING id, child_profile_id, name as buddy_name, personality_traits,
                   conversation_context, learned_preferences, message_count as total_messages,
                   last_interaction_at, created_at, updated_at, NULL as buddy_avatar_url`,
        [id, req.params.childId]
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
      const report = await queryOne<SafetyReport>(
        `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [reportId, req.user!.id, childId, childMessageId, inputSafety.level,
         `Child used concerning language: ${inputSafety.flags.join(', ')}`]
      );

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
    const sessionTitle = title || (mood ? `${mood.charAt(0).toUpperCase() + mood.slice(1)} mood chat` : DEFAULT_SESSION_TITLE);

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
      const report = await queryOne<SafetyReport>(
        `INSERT INTO safety_reports (id, user_id, child_profile_id, message_id, severity, issue_summary)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [reportId, req.user!.id, childId, childMessageId, inputSafety.level,
         `Child used concerning language: ${inputSafety.flags.join(', ')}`]
      );
      emitToUser(io, req.user!.id, 'safety-alert', report);
    }

    // Check for task completion
    const taskCompletion = await checkTaskCompletion(childId, message, imageKey, imageAnalysis);

    // Generate buddy response using AI
    const buddyResponse = await generateBuddyResponse(childId, message, child, inputSafety, imageAnalysis, taskCompletion);

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

    // Get buddy name
    const buddy = await queryOne<{ name: string }>(
      'SELECT name FROM chat_buddies WHERE child_profile_id = $1',
      [childId]
    );
    const buddyName = buddy?.name || 'Luno';

    // Generate a mood-aware greeting via AI
    const greetingPrompt = `You are ${buddyName}, a warm, caring AI friend for a child named ${child.name} (age ${child.age}). The child just told you they are feeling "${mood}" today. Write a short, warm opening message (2-3 sentences) that:
- Acknowledges their ${mood} feeling with empathy
- Shows you care about how they feel
- Gently invites them to talk about it or do something together
- Uses simple, age-appropriate language
- Feels natural, not clinical

Do NOT use emojis. Do NOT include your name at the start. Just write the message directly.`;

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
            { role: 'user', content: `The child is feeling ${mood}. Generate the opening message.` },
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
  taskCompletion?: TaskCompletionResult | null
): Promise<string> {
  // Get guardrails
  const guardrails = await queryOne<GuardrailSettings>(
    'SELECT * FROM guardrail_settings WHERE child_profile_id = $1',
    [childId]
  );

  // Get family members for context
  const familyResult = await query<FamilyMember>(
    `SELECT name, relationship, specific_relationship, occupation, hobbies, fun_facts,
            connection_description, photo_description, is_alive
     FROM family_members WHERE user_id = $1`,
    [child.user_id]
  );
  const familyMembers = familyResult.rows;

  // Get buddy name for persona
  const buddy = await queryOne<{ name: string }>(
    'SELECT name FROM chat_buddies WHERE child_profile_id = $1',
    [childId]
  );
  const buddyName = buddy?.name || 'Luno';

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

  // Get recent messages for context
  const recentMessages = await query<BuddyMessage>(
    `SELECT role, content FROM buddy_messages
     WHERE child_profile_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [childId]
  );

  // Build conversation history
  const history = recentMessages.rows.reverse().map(m => ({
    role: m.role === 'buddy' ? 'assistant' : 'user',
    content: m.content,
  }));

  // Build system prompt
  const systemPrompt = buildSystemPrompt(buddyName, child, guardrails, safety, familyMembers, taskCompletion, topicPosts, enabledTopics, customTopics);

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
        max_tokens: 500,
        temperature: 0.7,
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
  customTopics?: { topic_name: string; description: string }[]
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
- You speak with the warmth of a Pixar film and the playful rhythm of Dr. Seuss
- Nothing rushes. Nothing shouts. Every word feels like a warm hug.

${persona.tone}

HOW YOU SPEAK:
- Short, musical sentences (2-3 max)
- Speak at a peaceful pace - no rushing, no urgency
- Age-appropriate for a ${child.age}-year-old
- Sometimes use gentle rhymes or playful word sounds (but not forced)

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

  // Add family context
  if (familyMembers.length > 0) {
    prompt += `\n\nFAMILY CONTEXT (share with warmth when asked):`;
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
      if (member.fun_facts) details.push(`  - Special thing: ${member.fun_facts}`);
      if (!member.is_alive) details.push(`  - Remembered with so much love`);
      prompt += details.join('\n');
    }
    prompt += `\n\nWhen ${child.name} asks about family, respond with gentle warmth and accurate information.`;
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

  if (safety.level === 'red') {
    prompt += `\n\nGENTLE CARE NEEDED: The child shared something that needs extra tenderness. Respond with calm reassurance, suggest that some feelings are best shared with a grown-up who loves them. Keep your voice soft and safe.`;
  } else if (safety.level === 'yellow') {
    prompt += `\n\nEXTRA WARMTH NEEDED: ${child.name} might be feeling some big feelings. Be extra gentle, extra warm. Like a soft blanket on a cloudy day.`;
  }

  // Task completion instructions
  prompt += `\n\nWHEN TASKS ARE COMPLETED:
- Celebrate gently but genuinely: "Oh, how wonderful! You did it!"
- If they shared a picture, notice something specific and kind about it
- If they finished their whole journey, make it feel special: "What a beautiful journey you've finished, little explorer!"
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
        cp.name as child_name,
        bm.content as message_excerpt
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

export default router;
