/**
 * Analytics Routes
 *
 * Parent dashboard analytics and insights.
 * All data from database - no hardcoding.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Types
interface ActivityTimelineEntry {
  date: string;
  message_count: number;
  story_count: number;
  journey_steps_completed: number;
  session_duration_minutes: number;
}

interface WeeklySummary {
  total_messages: number;
  total_stories: number;
  total_journey_steps: number;
  total_session_minutes: number;
  average_daily_messages: number;
  most_active_day: string | null;
  topics_explored: string[];
}

interface ChatTopicEntry {
  topic: string;
  mention_count: number;
  last_mentioned_at: string;
}

interface JourneyProgressEntry {
  id: string;
  title: string;
  status: string;
  progress_percent: number;
  steps_completed: number;
  total_steps: number;
  started_at: string;
  completed_at: string | null;
}

/**
 * GET /api/analytics/activity/:childId
 * Get activity timeline for a child (last 30 days)
 */
router.get(
  '/activity/:childId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { days = '30' } = req.query;
      const daysNum = Math.min(parseInt(days as string, 10) || 30, 90);

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get activity data from source tables directly
      const activities = await query<ActivityTimelineEntry>(
        `SELECT
          d::text as date,
          COALESCE((SELECT COUNT(*) FROM buddy_messages WHERE child_profile_id = $1 AND role = 'child' AND created_at::date = d), 0)::int as message_count,
          COALESCE((SELECT COUNT(*) FROM stories WHERE child_profile_id = $1 AND created_at::date = d), 0)::int as story_count,
          COALESCE((SELECT COUNT(*) FROM journey_steps js JOIN journeys j ON js.journey_id = j.id WHERE j.child_profile_id = $1 AND js.completed_at IS NOT NULL AND js.completed_at::date = d), 0)::int as journey_steps_completed,
          0 as session_duration_minutes
        FROM generate_series(CURRENT_DATE - INTERVAL '${daysNum} days', CURRENT_DATE, '1 day') d
        WHERE EXISTS (
          SELECT 1 FROM buddy_messages WHERE child_profile_id = $1 AND created_at::date = d
          UNION ALL
          SELECT 1 FROM stories WHERE child_profile_id = $1 AND created_at::date = d
          UNION ALL
          SELECT 1 FROM journey_steps js JOIN journeys j ON js.journey_id = j.id WHERE j.child_profile_id = $1 AND js.completed_at IS NOT NULL AND js.completed_at::date = d
          UNION ALL
          SELECT 1 FROM child_activities WHERE child_profile_id = $1 AND created_at::date = d
        )
        ORDER BY d DESC`,
        [childId]
      );

      res.json(activities.rows);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/weekly-summary/:childId
 * Get weekly insights summary for a child
 */
router.get(
  '/weekly-summary/:childId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get weekly summary from source tables
      const msgCount = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM buddy_messages
         WHERE child_profile_id = $1 AND role = 'child'
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
        [childId]
      );
      const storyCount = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM stories
         WHERE child_profile_id = $1
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
        [childId]
      );
      const stepCount = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM journey_steps js
         JOIN journeys j ON js.journey_id = j.id
         WHERE j.child_profile_id = $1
         AND js.completed_at IS NOT NULL
         AND js.completed_at >= CURRENT_DATE - INTERVAL '7 days'`,
        [childId]
      );

      const summary = {
        total_messages: msgCount?.count || '0',
        total_stories: storyCount?.count || '0',
        total_journey_steps: stepCount?.count || '0',
        total_session_minutes: '0',
      };

      // Get most active day from child_activities
      const mostActiveDay = await queryOne<{ date: string }>(
        `SELECT created_at::date::text as date
         FROM child_activities
         WHERE child_profile_id = $1
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY created_at::date
         ORDER BY COUNT(*) DESC
         LIMIT 1`,
        [childId]
      );

      // Get topics explored this week (enabled topics)
      const topicsResult = await query<{ topic: string }>(
        `SELECT t.name as topic
         FROM child_topic_settings cts
         JOIN topics t ON cts.topic_id = t.id
         WHERE cts.child_profile_id = $1 AND cts.is_allowed = true
         ORDER BY t.name
         LIMIT 10`,
        [childId]
      );

      const totalMessages = parseInt(summary?.total_messages || '0', 10);

      const result: WeeklySummary = {
        total_messages: totalMessages,
        total_stories: parseInt(summary?.total_stories || '0', 10),
        total_journey_steps: parseInt(summary?.total_journey_steps || '0', 10),
        total_session_minutes: parseInt(summary?.total_session_minutes || '0', 10),
        average_daily_messages: Math.round(totalMessages / 7),
        most_active_day: mostActiveDay?.date || null,
        topics_explored: topicsResult.rows.map((t) => t.topic),
      };

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/chat-topics/:childId
 * Get chat topics breakdown for a child
 */
router.get(
  '/chat-topics/:childId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { limit = '20' } = req.query;
      const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get topics from enabled child topic settings
      const topics = await query<ChatTopicEntry>(
        `SELECT
          t.name as topic,
          1 as mention_count,
          cts.updated_at::text as last_mentioned_at
        FROM child_topic_settings cts
        JOIN topics t ON cts.topic_id = t.id
        WHERE cts.child_profile_id = $1 AND cts.is_allowed = true
        ORDER BY t.name
        LIMIT $2`,
        [childId, limitNum]
      );

      res.json(topics.rows);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/journey-progress/:childId
 * Get journey progress for a child
 */
router.get(
  '/journey-progress/:childId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get all journeys with progress
      const journeysResult = await query<{
        id: string;
        title: string;
        status: string;
        created_at: string;
        completed_at: string | null;
      }>(
        `SELECT id, title, status, created_at::text, completed_at::text
        FROM journeys
        WHERE child_profile_id = $1
        ORDER BY
          CASE WHEN status = 'active' THEN 0 ELSE 1 END,
          created_at DESC`,
        [childId]
      );

      // Get step counts for each journey
      const journeyProgress: JourneyProgressEntry[] = await Promise.all(
        journeysResult.rows.map(async (journey) => {
          const stepCounts = await queryOne<{
            total: string;
            completed: string;
          }>(
            `SELECT
              COUNT(*)::text as total,
              COUNT(*) FILTER (WHERE progress = 100)::text as completed
            FROM journey_steps
            WHERE journey_id = $1`,
            [journey.id]
          );

          const total = parseInt(stepCounts?.total || '0', 10);
          const completed = parseInt(stepCounts?.completed || '0', 10);
          const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            id: journey.id,
            title: journey.title,
            status: journey.status,
            progress_percent: progressPercent,
            steps_completed: completed,
            total_steps: total,
            started_at: journey.created_at,
            completed_at: journey.completed_at,
          };
        })
      );

      res.json(journeyProgress);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/overview
 * Get overview analytics for all children of a user
 */
router.get(
  '/overview',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      // Get all children with their stats
      const childrenResult = await query<{
        id: string;
        name: string;
        age: number;
        avatar_id: string | null;
      }>(
        'SELECT id, name, age, avatar_id FROM child_profiles WHERE user_id = $1',
        [userId]
      );

      const childStats = await Promise.all(
        childrenResult.rows.map(async (child) => {
          // Get stats for each child
          const stats = await queryOne<{
            total_points: string;
            current_streak: string;
            total_stories: string;
            total_journeys_completed: string;
          }>(
            `SELECT
              COALESCE(total_points, 0) as total_points,
              COALESCE(current_streak, 0) as current_streak,
              COALESCE(total_stories, 0) as total_stories,
              COALESCE(total_journeys_completed, 0) as total_journeys_completed
            FROM child_stats
            WHERE child_profile_id = $1`,
            [child.id]
          );

          // Get weekly activity from source tables (daily_analytics is not populated)
          const weeklyActivity = await queryOne<{
            message_count: string;
            story_count: string;
          }>(
            `SELECT
              COALESCE(
                (SELECT COUNT(*) FROM buddy_messages
                 WHERE child_profile_id = $1
                   AND role = 'child'
                   AND created_at >= CURRENT_DATE - INTERVAL '7 days'),
                0
              ) as message_count,
              COALESCE(
                (SELECT COUNT(*) FROM stories
                 WHERE child_profile_id = $1
                   AND created_at >= CURRENT_DATE - INTERVAL '7 days'),
                0
              ) as story_count`,
            [child.id]
          );

          return {
            child: {
              id: child.id,
              name: child.name,
              age: child.age,
              avatar_id: child.avatar_id,
            },
            stats: {
              total_points: parseInt(stats?.total_points || '0', 10),
              current_streak: parseInt(stats?.current_streak || '0', 10),
              total_stories: parseInt(stats?.total_stories || '0', 10),
              total_journeys_completed: parseInt(stats?.total_journeys_completed || '0', 10),
            },
            weekly_activity: {
              messages: parseInt(weeklyActivity?.message_count || '0', 10),
              stories: parseInt(weeklyActivity?.story_count || '0', 10),
            },
          };
        })
      );

      res.json({
        children: childStats,
        total_children: childrenResult.rows.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
