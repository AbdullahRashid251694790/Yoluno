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

      // Get activity data from daily_analytics table
      const activities = await query<ActivityTimelineEntry>(
        `SELECT
          date::text,
          COALESCE(message_count, 0) as message_count,
          COALESCE(story_count, 0) as story_count,
          COALESCE(journey_steps_completed, 0) as journey_steps_completed,
          COALESCE(session_duration_minutes, 0) as session_duration_minutes
        FROM daily_analytics
        WHERE child_profile_id = $1
          AND date >= CURRENT_DATE - INTERVAL '${daysNum} days'
        ORDER BY date DESC`,
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

      // Get weekly summary from daily_analytics
      const summary = await queryOne<{
        total_messages: string;
        total_stories: string;
        total_journey_steps: string;
        total_session_minutes: string;
      }>(
        `SELECT
          COALESCE(SUM(message_count), 0) as total_messages,
          COALESCE(SUM(story_count), 0) as total_stories,
          COALESCE(SUM(journey_steps_completed), 0) as total_journey_steps,
          COALESCE(SUM(session_duration_minutes), 0) as total_session_minutes
        FROM daily_analytics
        WHERE child_profile_id = $1
          AND date >= CURRENT_DATE - INTERVAL '7 days'`,
        [childId]
      );

      // Get most active day
      const mostActiveDay = await queryOne<{ date: string; activity_score: string }>(
        `SELECT
          date::text,
          (message_count + story_count * 10 + journey_steps_completed * 5) as activity_score
        FROM daily_analytics
        WHERE child_profile_id = $1
          AND date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY activity_score DESC
        LIMIT 1`,
        [childId]
      );

      // Get topics explored this week
      const topicsResult = await query<{ topic: string }>(
        `SELECT DISTINCT topic
        FROM topic_analytics
        WHERE child_profile_id = $1
          AND last_mentioned_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        ORDER BY mention_count DESC
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

      // Get topic analytics
      const topics = await query<ChatTopicEntry>(
        `SELECT
          topic,
          mention_count,
          last_mentioned_at::text
        FROM topic_analytics
        WHERE child_profile_id = $1
        ORDER BY mention_count DESC
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

          // Get weekly activity
          const weeklyActivity = await queryOne<{
            message_count: string;
            story_count: string;
          }>(
            `SELECT
              COALESCE(SUM(message_count), 0) as message_count,
              COALESCE(SUM(story_count), 0) as story_count
            FROM daily_analytics
            WHERE child_profile_id = $1
              AND date >= CURRENT_DATE - INTERVAL '7 days'`,
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
