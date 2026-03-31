/**
 * Daily Missions Route
 *
 * Auto-generates 3 missions per child per day.
 * Completion detected from existing activity data.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ChildProfile } from '../types/index.js';

const router = Router();
router.use(requireAuth);

// Mission definitions
interface MissionDef {
  type: string;
  title: string;
  emoji: string;
}

const MISSION_POOL: MissionDef[] = [
  { type: 'chat', title: 'Ask Luno something new!', emoji: '💬' },
  { type: 'chat', title: 'Have a chat with Luno!', emoji: '🗣️' },
  { type: 'chat', title: 'Tell Luno about your day!', emoji: '📝' },
  { type: 'story', title: 'Create a fun story!', emoji: '📖' },
  { type: 'story', title: 'Write an adventure story!', emoji: '🗺️' },
  { type: 'story', title: 'Make a magical story!', emoji: '✨' },
  { type: 'journey_step', title: 'Complete a journey step!', emoji: '🚀' },
  { type: 'journey_step', title: 'Take one step on a journey!', emoji: '👣' },
  { type: 'journey_step', title: 'Make progress on a journey!', emoji: '🏃' },
  { type: 'family', title: 'Visit your family tree!', emoji: '👨‍👩‍👧' },
  { type: 'family', title: 'Check out your family album!', emoji: '🌳' },
];

// Pick 3 unique-type missions deterministically based on date + childId
function generateMissions(childId: string, date: string): MissionDef[] {
  // Create a simple hash from childId + date for deterministic but varied selection
  const seed = (childId + date).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const types = ['chat', 'story', 'journey_step', 'family'];
  const selectedTypes: string[] = [];

  // Always include chat as first mission
  selectedTypes.push('chat');

  // Pick 2 more unique types from remaining
  const remaining = types.filter((t) => t !== 'chat');
  const idx1 = seed % remaining.length;
  selectedTypes.push(remaining[idx1]);
  const remaining2 = remaining.filter((_, i) => i !== idx1);
  const idx2 = (seed * 7) % remaining2.length;
  selectedTypes.push(remaining2[idx2]);

  // Pick a specific mission for each type
  const missions: MissionDef[] = [];
  for (const type of selectedTypes) {
    const pool = MISSION_POOL.filter((m) => m.type === type);
    const pick = pool[(seed + type.charCodeAt(0)) % pool.length];
    missions.push(pick);
  }

  return missions;
}

// Verify child belongs to user
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

// Check completion status from existing data
async function checkCompletions(childId: string, date: string): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {
    chat: false,
    story: false,
    journey_step: false,
    family: false,
  };

  try {

  // Chat: any child message sent today
  const chatResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM buddy_messages
     WHERE child_profile_id = $1 AND role = 'child'
     AND created_at::date = $2::date`,
    [childId, date]
  );
  results.chat = parseInt(chatResult?.count || '0', 10) > 0;

  // Story: any story created today
  const storyResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM stories
     WHERE child_profile_id = $1
     AND created_at::date = $2::date`,
    [childId, date]
  );
  results.story = parseInt(storyResult?.count || '0', 10) > 0;

  // Journey step: any step completed today
  const stepResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM journey_steps js
     JOIN journeys j ON js.journey_id = j.id
     WHERE j.child_profile_id = $1
     AND js.completed_at IS NOT NULL
     AND js.completed_at::date = $2::date`,
    [childId, date]
  );
  results.journey_step = parseInt(stepResult?.count || '0', 10) > 0;

  // Family: check child_activities for family_explored today
  const familyResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM child_activities ca
     JOIN activity_types at ON ca.activity_type_id = at.id
     WHERE ca.child_profile_id = $1
     AND at.name = 'family_explored'
     AND ca.created_at::date = $2::date`,
    [childId, date]
  );
  results.family = parseInt(familyResult?.count || '0', 10) > 0;

  } catch (error) {
    console.error('Error checking mission completions:', (error as Error).message);
  }

  return results;
}

// GET /api/daily-missions/:childId — get today's missions with live completion status
router.get('/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    await verifyChildAccess(childId, req.user!.id);

    const today = new Date().toISOString().split('T')[0];

    // Check if today's missions exist
    let missions = await queryOne<any>(
      'SELECT * FROM daily_missions WHERE child_profile_id = $1 AND mission_date = $2',
      [childId, today]
    );

    // If not, generate and save them
    if (!missions) {
      const generated = generateMissions(childId, today);

      missions = await queryOne<any>(
        `INSERT INTO daily_missions (
          id, child_profile_id, mission_date,
          mission_1_type, mission_1_title, mission_1_emoji,
          mission_2_type, mission_2_title, mission_2_emoji,
          mission_3_type, mission_3_title, mission_3_emoji
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (child_profile_id, mission_date) DO NOTHING
        RETURNING *`,
        [
          uuidv4(), childId, today,
          generated[0].type, generated[0].title, generated[0].emoji,
          generated[1].type, generated[1].title, generated[1].emoji,
          generated[2].type, generated[2].title, generated[2].emoji,
        ]
      );

      // If ON CONFLICT hit, fetch the existing row
      if (!missions) {
        missions = await queryOne<any>(
          'SELECT * FROM daily_missions WHERE child_profile_id = $1 AND mission_date = $2',
          [childId, today]
        );
      }
    }

    // Check live completion status
    const completions = await checkCompletions(childId, today);

    const m1Done = completions[missions.mission_1_type] || false;
    const m2Done = completions[missions.mission_2_type] || false;
    const m3Done = completions[missions.mission_3_type] || false;
    const allDone = m1Done && m2Done && m3Done;

    // Update completion status in DB if changed
    if (m1Done !== missions.mission_1_completed ||
        m2Done !== missions.mission_2_completed ||
        m3Done !== missions.mission_3_completed) {
      await query(
        `UPDATE daily_missions SET
          mission_1_completed = $1,
          mission_2_completed = $2,
          mission_3_completed = $3,
          all_completed = $4
        WHERE id = $5`,
        [m1Done, m2Done, m3Done, allDone, missions.id]
      );
    }

    res.json({
      id: missions.id,
      date: missions.mission_date,
      missions: [
        { type: missions.mission_1_type, title: missions.mission_1_title, emoji: missions.mission_1_emoji, completed: m1Done },
        { type: missions.mission_2_type, title: missions.mission_2_title, emoji: missions.mission_2_emoji, completed: m2Done },
        { type: missions.mission_3_type, title: missions.mission_3_title, emoji: missions.mission_3_emoji, completed: m3Done },
      ],
      allCompleted: allDone,
      bonusAwarded: missions.bonus_awarded,
    });
  } catch (error) {
    console.error('Daily missions GET error:', (error as Error).message);
    next(error);
  }
});

// POST /api/daily-missions/:childId/claim — claim bonus points for completed missions
router.post('/:childId/claim', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    await verifyChildAccess(childId, req.user!.id);

    const today = new Date().toISOString().split('T')[0];

    const missions = await queryOne<any>(
      'SELECT * FROM daily_missions WHERE child_profile_id = $1 AND mission_date = $2',
      [childId, today]
    );

    if (!missions) {
      throw new AppError(404, 'No missions found for today');
    }

    if (missions.bonus_awarded) {
      res.json({ message: 'Bonus already claimed', points: 0 });
      return;
    }

    // Check live completions
    const completions = await checkCompletions(childId, today);
    const m1Done = completions[missions.mission_1_type] || false;
    const m2Done = completions[missions.mission_2_type] || false;
    const m3Done = completions[missions.mission_3_type] || false;

    // Award 5 points per completed mission
    let points = 0;
    if (m1Done) points += 5;
    if (m2Done) points += 5;
    if (m3Done) points += 5;

    if (points === 0) {
      res.json({ message: 'No missions completed yet', points: 0 });
      return;
    }

    // Award points to child_stats
    await query(
      `UPDATE child_stats SET total_points = total_points + $1
       WHERE child_profile_id = $2`,
      [points, childId]
    );

    // Mark bonus as awarded
    await query(
      `UPDATE daily_missions SET
        mission_1_completed = $1,
        mission_2_completed = $2,
        mission_3_completed = $3,
        all_completed = $4,
        bonus_awarded = true
      WHERE id = $5`,
      [m1Done, m2Done, m3Done, m1Done && m2Done && m3Done, missions.id]
    );

    res.json({
      message: m1Done && m2Done && m3Done ? 'Daily Champion! All missions complete!' : 'Mission bonus claimed!',
      points,
      allCompleted: m1Done && m2Done && m3Done,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/daily-missions/:childId/log-visit/:type — log a page visit for mission tracking
router.post('/:childId/log-visit/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, type } = req.params;
    await verifyChildAccess(childId, req.user!.id);

    const validTypes = ['family_explored'];
    if (!validTypes.includes(type)) {
      throw new AppError(400, 'Invalid visit type');
    }

    // Get the activity_type_id
    const activityType = await queryOne<{ id: string }>(
      'SELECT id FROM activity_types WHERE name = $1',
      [type]
    );

    if (!activityType) {
      throw new AppError(400, 'Activity type not found');
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already logged today
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM child_activities
       WHERE child_profile_id = $1 AND activity_type_id = $2
       AND created_at::date = $3::date`,
      [childId, activityType.id, today]
    );

    if (!existing) {
      await query(
        `INSERT INTO child_activities (id, child_profile_id, activity_type_id, points_earned)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), childId, activityType.id, 3]
      );
    }

    res.json({ logged: true });
  } catch (error) {
    next(error);
  }
});

export default router;
