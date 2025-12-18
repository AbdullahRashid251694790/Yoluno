import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToUser, emitToChild } from '../socket/index.js';
import type { BuddyMessage, ChatBuddy, SafetyReport, ChildProfile, GuardrailSettings } from '../types/index.js';

const router = Router();

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
      'SELECT * FROM chat_buddies WHERE child_profile_id = $1',
      [req.params.childId]
    );

    // Auto-create buddy if doesn't exist
    if (!buddy) {
      const id = uuidv4();
      buddy = await queryOne<ChatBuddy>(
        `INSERT INTO chat_buddies (id, child_profile_id, name, message_count)
         VALUES ($1, $2, 'Buddy', 0)
         RETURNING *`,
        [id, req.params.childId]
      );
    }

    res.json(buddy);
  } catch (error) {
    next(error);
  }
});

// POST /api/buddy-chat/:childId/send
router.post('/:childId/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io: Server = req.app.get('io');
    const { message } = req.body;
    const childId = req.params.childId;

    if (!message || typeof message !== 'string') {
      throw new AppError(400, 'Message is required');
    }

    const child = await verifyChildAccess(childId, req.user!.id);

    // Analyze safety of input
    const inputSafety = analyzeSafety(message);

    // Save child message
    const childMessageId = uuidv4();
    const childMessage = await queryOne<BuddyMessage>(
      `INSERT INTO buddy_messages (id, child_profile_id, role, content, safety_level, safety_flags)
       VALUES ($1, $2, 'child', $3, $4, $5)
       RETURNING *`,
      [childMessageId, childId, message, inputSafety.level, JSON.stringify({ flags: inputSafety.flags })]
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

    // Generate buddy response using AI
    const buddyResponse = await generateBuddyResponse(childId, message, child, inputSafety);

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

    res.json({
      childMessage,
      buddyMessage,
      safetyLevel: inputSafety.level,
    });
  } catch (error) {
    next(error);
  }
});

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
  safety: { level: string; flags: string[] }
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
  const systemPrompt = buildSystemPrompt(child, guardrails, safety, familyMembers);

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
          { role: 'user', content: message },
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
  familyMembers: FamilyMember[]
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
