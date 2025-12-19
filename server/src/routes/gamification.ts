import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction, PoolClient } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { z } from 'zod';
import type { ChildProfile } from '../types/index.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Types for gamification
interface ActivityType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  points_value: number;
  icon_name: string | null;
  category: string;
  is_active: boolean;
  created_at: Date;
}

interface ChildStats {
  id: string;
  child_profile_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_activities: number;
  total_stories: number;
  total_journeys_completed: number;
  total_chat_messages: number;
  created_at: Date;
  updated_at: Date;
}

interface BadgeDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon_url: string;
  requirement_type: string;
  requirement_value: number;
  requirement_metadata: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
}

interface BadgeEarned {
  id: string;
  child_profile_id: string;
  badge_definition_id: string;
  earned_at: Date;
  notified: boolean;
}

interface BadgeWithDefinition extends BadgeEarned {
  badge: BadgeDefinition;
}

interface ChildActivity {
  id: string;
  child_profile_id: string;
  activity_type_id: string;
  points_earned: number;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// Validation schemas
const logActivitySchema = z.object({
  activityTypeName: z.string().min(1, 'Activity type name is required'),
  metadata: z.record(z.unknown()).optional(),
});

const acknowledgeBadgesSchema = z.object({
  badgeIds: z.array(z.string().uuid()).min(1, 'At least one badge ID required'),
});

// Helper to verify child access
async function verifyChildAccess(childId: string, userId: string): Promise<void> {
  const child = await queryOne<ChildProfile>(
    'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  if (!child) {
    throw new AppError(403, 'Access denied to child profile');
  }
}

// Helper to calculate streak from streak_history
async function calculateStreak(client: PoolClient, childId: string): Promise<number> {
  const result = await client.query<{ streak: number }>(
    `WITH consecutive_days AS (
       SELECT activity_date,
              activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int AS grp
       FROM streak_history
       WHERE child_profile_id = $1
       ORDER BY activity_date DESC
     )
     SELECT COUNT(*)::integer as streak
     FROM consecutive_days
     WHERE grp = (SELECT grp FROM consecutive_days LIMIT 1)`,
    [childId]
  );
  return result.rows[0]?.streak || 0;
}

// Helper to check and award badges
async function checkAndAwardBadges(
  client: PoolClient,
  childId: string,
  stats: ChildStats
): Promise<BadgeDefinition[]> {
  const newBadges: BadgeDefinition[] = [];

  // Get all unearned active badges
  const unearnedResult = await client.query<BadgeDefinition>(
    `SELECT bd.* FROM badge_definitions bd
     WHERE bd.is_active = true
     AND NOT EXISTS (
       SELECT 1 FROM badges_earned be
       WHERE be.badge_definition_id = bd.id AND be.child_profile_id = $1
     )`,
    [childId]
  );

  for (const badge of unearnedResult.rows) {
    let earned = false;

    switch (badge.requirement_type) {
      case 'streak':
        earned = stats.current_streak >= badge.requirement_value;
        break;
      case 'points':
        earned = stats.total_points >= badge.requirement_value;
        break;
      case 'activity_count':
        // Check based on badge name pattern
        if (badge.name.includes('chat')) {
          earned = stats.total_chat_messages >= badge.requirement_value;
        } else if (badge.name.includes('story')) {
          earned = stats.total_stories >= badge.requirement_value;
        } else if (badge.name.includes('journey_finisher') || badge.name.includes('journey_explorer')) {
          earned = stats.total_journeys_completed >= badge.requirement_value;
        } else if (badge.name.includes('journey')) {
          earned = stats.total_activities >= badge.requirement_value;
        } else {
          earned = stats.total_activities >= badge.requirement_value;
        }
        break;
    }

    if (earned) {
      await client.query(
        `INSERT INTO badges_earned (id, child_profile_id, badge_definition_id, notified)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (child_profile_id, badge_definition_id) DO NOTHING`,
        [uuidv4(), childId, badge.id]
      );
      newBadges.push(badge);
    }
  }

  return newBadges;
}

// GET /api/gamification/activity-types - Get all activity types
router.get('/activity-types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<ActivityType>(
      'SELECT * FROM activity_types WHERE is_active = true ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/gamification/stats/:childId - Get child's gamification stats
router.get('/stats/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;

    await verifyChildAccess(childId, req.user!.id);

    // Get or create stats
    let stats = await queryOne<ChildStats>(
      'SELECT * FROM child_stats WHERE child_profile_id = $1',
      [childId]
    );

    if (!stats) {
      // Create stats if missing (trigger should have done this)
      stats = await queryOne<ChildStats>(
        `INSERT INTO child_stats (child_profile_id)
         VALUES ($1)
         ON CONFLICT (child_profile_id) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [childId]
      );
    }

    if (!stats) {
      throw new AppError(500, 'Failed to retrieve or create child stats');
    }

    // Get recent badges (last 5)
    const recentBadgesResult = await query<BadgeWithDefinition>(
      `SELECT be.*,
              row_to_json(bd.*) as badge
       FROM badges_earned be
       JOIN badge_definitions bd ON be.badge_definition_id = bd.id
       WHERE be.child_profile_id = $1
       ORDER BY be.earned_at DESC
       LIMIT 5`,
      [childId]
    );

    // Get unnotified badges
    const unnotifiedBadgesResult = await query<BadgeWithDefinition>(
      `SELECT be.*,
              row_to_json(bd.*) as badge
       FROM badges_earned be
       JOIN badge_definitions bd ON be.badge_definition_id = bd.id
       WHERE be.child_profile_id = $1 AND be.notified = false
       ORDER BY be.earned_at DESC`,
      [childId]
    );

    res.json({
      stats,
      recentBadges: recentBadgesResult.rows,
      unnotifiedBadges: unnotifiedBadgesResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/gamification/badges/:childId - Get all badges for a child
router.get('/badges/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;

    await verifyChildAccess(childId, req.user!.id);

    // Get all earned badges
    const earnedResult = await query<BadgeWithDefinition>(
      `SELECT be.*,
              row_to_json(bd.*) as badge
       FROM badges_earned be
       JOIN badge_definitions bd ON be.badge_definition_id = bd.id
       WHERE be.child_profile_id = $1
       ORDER BY bd.sort_order ASC`,
      [childId]
    );

    // Get all available badges
    const availableResult = await query<BadgeDefinition>(
      'SELECT * FROM badge_definitions WHERE is_active = true ORDER BY sort_order ASC'
    );

    res.json({
      earned: earnedResult.rows,
      available: availableResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/gamification/activity/:childId - Log an activity
router.post('/activity/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const { activityTypeName, metadata } = validateBody(logActivitySchema, req.body);

    await verifyChildAccess(childId, req.user!.id);

    // Get activity type from database (NO hardcoding)
    const activityType = await queryOne<ActivityType>(
      'SELECT * FROM activity_types WHERE name = $1 AND is_active = true',
      [activityTypeName]
    );

    if (!activityType) {
      throw new AppError(400, `Invalid activity type: ${activityTypeName}`);
    }

    const result = await withTransaction(async (client) => {
      const today = new Date().toISOString().split('T')[0];

      // 1. Log the activity
      const activityResult = await client.query<ChildActivity>(
        `INSERT INTO child_activities (id, child_profile_id, activity_type_id, points_earned, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [uuidv4(), childId, activityType.id, activityType.points_value, metadata || {}]
      );

      // 2. Update streak history
      await client.query(
        `INSERT INTO streak_history (id, child_profile_id, activity_date, activity_count)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (child_profile_id, activity_date)
         DO UPDATE SET activity_count = streak_history.activity_count + 1`,
        [uuidv4(), childId, today]
      );

      // 3. Calculate current streak
      const currentStreak = await calculateStreak(client, childId);

      // 4. Build stats update based on activity category
      const statsIncrement: Record<string, number> = {
        total_points: activityType.points_value,
        total_activities: 1,
      };

      if (activityType.category === 'chat') {
        statsIncrement.total_chat_messages = 1;
      } else if (activityType.category === 'story' && activityTypeName === 'story_created') {
        statsIncrement.total_stories = 1;
      } else if (activityTypeName === 'journey_completed') {
        statsIncrement.total_journeys_completed = 1;
      }

      // 5. Update child stats
      const statsResult = await client.query<ChildStats>(
        `UPDATE child_stats
         SET total_points = total_points + $1,
             current_streak = $2,
             longest_streak = GREATEST(longest_streak, $2),
             last_activity_date = $3,
             total_activities = total_activities + $4,
             total_stories = total_stories + $5,
             total_journeys_completed = total_journeys_completed + $6,
             total_chat_messages = total_chat_messages + $7,
             updated_at = NOW()
         WHERE child_profile_id = $8
         RETURNING *`,
        [
          statsIncrement.total_points,
          currentStreak,
          today,
          statsIncrement.total_activities,
          statsIncrement.total_stories || 0,
          statsIncrement.total_journeys_completed || 0,
          statsIncrement.total_chat_messages || 0,
          childId,
        ]
      );

      const updatedStats = statsResult.rows[0];

      // 6. Check for new badges
      const newBadges = await checkAndAwardBadges(client, childId, updatedStats);

      return {
        activity: activityResult.rows[0],
        pointsEarned: activityType.points_value,
        newBadges,
        streakUpdated: true,
        newStreak: currentStreak,
        stats: updatedStats,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/gamification/badges/:childId/acknowledge - Mark badges as notified
router.post('/badges/:childId/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const { badgeIds } = validateBody(acknowledgeBadgesSchema, req.body);

    await verifyChildAccess(childId, req.user!.id);

    await query(
      `UPDATE badges_earned
       SET notified = true
       WHERE child_profile_id = $1 AND badge_definition_id = ANY($2::uuid[])`,
      [childId, badgeIds]
    );

    res.json({ message: 'Badges acknowledged', count: badgeIds.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/gamification/leaderboard - Get leaderboard (optional feature)
router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only show children belonging to the current user
    const result = await query<ChildStats & { child_name: string }>(
      `SELECT cs.*, cp.name as child_name
       FROM child_stats cs
       JOIN child_profiles cp ON cs.child_profile_id = cp.id
       WHERE cp.user_id = $1
       ORDER BY cs.total_points DESC`,
      [req.user!.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/gamification/activities/:childId - Get recent activities
router.get('/activities/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    await verifyChildAccess(childId, req.user!.id);

    const result = await query<ChildActivity & { activity_type: ActivityType }>(
      `SELECT ca.*, row_to_json(at.*) as activity_type
       FROM child_activities ca
       JOIN activity_types at ON ca.activity_type_id = at.id
       WHERE ca.child_profile_id = $1
       ORDER BY ca.created_at DESC
       LIMIT $2 OFFSET $3`,
      [childId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
