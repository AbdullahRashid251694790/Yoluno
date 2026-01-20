import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import multer from 'multer';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToUser, emitToChild } from '../socket/index.js';
import { uploadToS3, getSignedDownloadUrl } from '../utils/s3.js';
import type { BuddyMessage, ChatBuddy, SafetyReport, ChildProfile, GuardrailSettings, Journey, JourneyStep } from '../types/index.js';

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

// Task completion keywords
const COMPLETION_KEYWORDS = ['done', 'finished', 'completed', 'i did it', 'all done', 'look what i made', 'i finished'];

router.use(requireAuth);

// Safety keywords
const RED_FLAG_KEYWORDS = ['kill', 'hurt', 'hate', 'die', 'blood', 'gun', 'weapon', 'suicide', 'murder'];
const YELLOW_FLAG_KEYWORDS = ['stupid', 'dumb', 'shut up', 'angry', 'scared', 'fight', 'bully'];

function analyzeSafety(message: string): { level: 'green' | 'yellow' | 'red'; flags: string[] } {
  const lowerMessage = message.toLowerCase();
  const flags: string[] = [];

  for (const keyword of RED_FLAG_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      flags.push(keyword);
    }
  }

  if (flags.length > 0) {
    return { level: 'red', flags };
  }

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
      await uploadToS3(imageKey, imageFile.buffer, imageFile.mimetype);

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
      });
    }

    res.json({
      childMessage,
      buddyMessage,
      safetyLevel: inputSafety.level,
      taskCompleted: taskCompletion?.completed || false,
    });
  } catch (error) {
    next(error);
  }
});

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
  }

  return {
    completed: true,
    journeyId: activeJourney.id,
    stepId: incompleteStep.id,
    stepTitle: incompleteStep.type,
    journeyCompleted,
    rewardEarned,
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
    `SELECT name, relationship, occupation, hobbies, fun_facts,
            connection_description, photo_description, is_alive
     FROM family_members WHERE user_id = $1`,
    [child.user_id]
  );
  const familyMembers = familyResult.rows;

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
  const systemPrompt = buildSystemPrompt(child, guardrails, safety, familyMembers, taskCompletion);

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
  child: ChildProfile,
  guardrails: GuardrailSettings | null,
  safety: { level: string; flags: string[] },
  familyMembers: FamilyMember[],
  taskCompletion?: TaskCompletionResult | null
): string {
  let prompt = `You are Luno, a friendly, supportive AI companion for a ${child.age}-year-old child named ${child.name}.
Your personality is warm, encouraging, and age-appropriate.
Keep responses short (2-3 sentences max) and easy to understand.
Never discuss inappropriate topics, violence, or anything harmful.
Be positive and redirect negative conversations gently.`;

  if (child.interests && child.interests.length > 0) {
    prompt += `\nThe child is interested in: ${child.interests.join(', ')}.`;
  }

  // Add family context
  if (familyMembers.length > 0) {
    prompt += `\n\nFAMILY CONTEXT (use this when the child asks about family members):`;
    for (const member of familyMembers) {
      const details: string[] = [];
      details.push(`\n${member.name} (${member.relationship})`);
      if (member.connection_description) details.push(`  - Relation: ${member.connection_description}`);
      if (member.occupation) details.push(`  - Job: ${member.occupation}`);
      if (member.hobbies && member.hobbies.length > 0) details.push(`  - Hobbies: ${member.hobbies.join(', ')}`);
      if (member.fun_facts) details.push(`  - Fun fact: ${member.fun_facts}`);
      if (!member.is_alive) details.push(`  - Note: No longer with us, remembered with love`);
      prompt += details.join('\n');
    }
    prompt += `\n\nWhen the child asks about family (like "Who is dad?", "What does grandma do?"), use the above information to give accurate, loving answers.`;
  }

  if (guardrails?.blocked_topics && guardrails.blocked_topics.length > 0) {
    prompt += `\nAvoid discussing: ${guardrails.blocked_topics.join(', ')}.`;
  }

  if (safety.level === 'red') {
    prompt += `\nIMPORTANT: The child's message contained concerning content. Respond with care, redirect positively, and suggest talking to a trusted adult if appropriate.`;
  } else if (safety.level === 'yellow') {
    prompt += `\nNote: The child seems to be expressing some negative emotions. Be extra supportive and encouraging.`;
  }

  // Task completion instructions
  prompt += `\n\nTASK COMPLETION RULES:
- If child says "done", "finished", or "completed" with a shared image, celebrate their accomplishment enthusiastically!
- Be specific about what you see in their image when complimenting their work.
- If they completed their entire journey, make it extra special with lots of celebration!
- If they need to share a picture but haven't, gently encourage them: "Great job! Can you share a picture of what you did?"`;

  return prompt;
}

function getDefaultResponse(safetyLevel: string): string {
  if (safetyLevel === 'red') {
    return "I care about you! If something is bothering you, it's okay to talk to a parent or teacher about it. I'm here to be your friend!";
  }
  if (safetyLevel === 'yellow') {
    return "I understand. It's okay to have big feelings sometimes. Would you like to talk about something fun instead?";
  }
  return "That's interesting! Tell me more about what you're thinking!";
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

    const signedUrl = await getSignedDownloadUrl(message.image_key, 3600);
    res.json({ url: signedUrl });
  } catch (error) {
    next(error);
  }
});

// GET /api/buddy-chat/safety-reports
router.get('/safety-reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unreviewed } = req.query;

    let queryText = 'SELECT * FROM safety_reports WHERE user_id = $1';
    const params: unknown[] = [req.user!.id];

    if (unreviewed === 'true') {
      queryText += ' AND reviewed = false';
    }

    queryText += ' ORDER BY created_at DESC';

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
