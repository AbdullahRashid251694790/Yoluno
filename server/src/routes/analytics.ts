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
  topics: string[];
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

      // Get activity data from source tables. session_duration_minutes is
      // derived from child_screen_sessions — the frontend heartbeat writes
      // rows there every ~30s while the child is on a /kids/ screen.
      const activities = await query<ActivityTimelineEntry>(
        `SELECT
          d::text as date,
          COALESCE((SELECT COUNT(*) FROM buddy_messages WHERE child_profile_id = $1 AND role = 'child' AND created_at::date = d), 0)::int as message_count,
          COALESCE((SELECT COUNT(*) FROM stories WHERE child_profile_id = $1 AND created_at::date = d), 0)::int as story_count,
          COALESCE((SELECT COUNT(*) FROM journey_steps js JOIN journeys j ON js.journey_id = j.id WHERE j.child_profile_id = $1 AND js.completed_at IS NOT NULL AND js.completed_at::date = d), 0)::int as journey_steps_completed,
          COALESCE((
            SELECT SUM(GREATEST(EXTRACT(EPOCH FROM (last_heartbeat_at - started_at)) / 60.0, 0.5))::int
            FROM child_screen_sessions
            WHERE child_profile_id = $1 AND started_at::date = d
          ), 0) as session_duration_minutes
        FROM generate_series(CURRENT_DATE - INTERVAL '${daysNum} days', CURRENT_DATE, '1 day') d
        WHERE EXISTS (
          SELECT 1 FROM buddy_messages WHERE child_profile_id = $1 AND created_at::date = d
          UNION ALL
          SELECT 1 FROM stories WHERE child_profile_id = $1 AND created_at::date = d
          UNION ALL
          SELECT 1 FROM journey_steps js JOIN journeys j ON js.journey_id = j.id WHERE j.child_profile_id = $1 AND js.completed_at IS NOT NULL AND js.completed_at::date = d
          UNION ALL
          SELECT 1 FROM child_activities WHERE child_profile_id = $1 AND created_at::date = d
          UNION ALL
          SELECT 1 FROM child_screen_sessions WHERE child_profile_id = $1 AND started_at::date = d
        )
        ORDER BY d DESC`,
        [childId]
      );

      // Attach per-day topic chips: match child messages on each day
      // against the topics table (same ILIKE approach as chat-topics).
      const enriched = await Promise.all(
        activities.rows.map(async (row) => {
          const topicResult = await query<{ name: string }>(
            `SELECT DISTINCT t.name
             FROM topics t
             INNER JOIN buddy_messages bm
               ON bm.child_profile_id = $1
               AND bm.role = 'child'
               AND bm.created_at::date = $2::date
               AND bm.content ILIKE '%' || t.name || '%'
             WHERE t.is_active = true
             LIMIT 5`,
            [childId, row.date]
          );
          return { ...row, topics: topicResult.rows.map((r) => r.name) };
        })
      );

      res.json(enriched);
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

      // Match child's chat messages against known topic names, also
      // surfacing the curriculum category each topic belongs to so the
      // Insights page can render curriculum chips.
      const topics = await query<ChatTopicEntry & { category_name: string | null }>(
        `SELECT
          t.name as topic,
          tc.name as category_name,
          COUNT(bm.id)::integer as mention_count,
          MAX(bm.created_at)::text as last_mentioned_at
        FROM topics t
        LEFT JOIN topic_categories tc ON tc.id = t.category_id
        INNER JOIN buddy_messages bm
          ON bm.child_profile_id = $1
          AND bm.role = 'child'
          AND bm.content ILIKE '%' || t.name || '%'
        WHERE t.is_active = true
        GROUP BY t.name, tc.name
        ORDER BY mention_count DESC, last_mentioned_at DESC
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

          // Topics this child has discussed with Luno — match known topic
          // names against anything they've said in chat. Most recently
          // mentioned topics first, capped at 5 tags for the UI.
          const chatTopicsResult = await query<{ name: string }>(
            `SELECT t.name
             FROM topics t
             INNER JOIN buddy_messages bm
               ON bm.child_profile_id = $1
               AND bm.role = 'child'
               AND bm.content ILIKE '%' || t.name || '%'
             WHERE t.is_active = true
             GROUP BY t.name
             ORDER BY MAX(bm.created_at) DESC
             LIMIT 5`,
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
            chat_topics: chatTopicsResult.rows.map((r) => r.name),
          };
        })
      );

      // Aggregate counts across all of the user's children for the dashboard
      // home metric tiles.

      // Topics explored — distinct topic names that show up in any child's
      // chat messages. Uses the same ILIKE match as /chat-topics/:childId.
      const topicsResult = await queryOne<{ count: string }>(
        `SELECT COUNT(DISTINCT t.id) AS count
         FROM topics t
         INNER JOIN buddy_messages bm
           ON bm.role = 'child'
           AND bm.content ILIKE '%' || t.name || '%'
         INNER JOIN child_profiles cp
           ON cp.id = bm.child_profile_id
           AND cp.user_id = $1
         WHERE t.is_active = true`,
        [userId]
      );

      // Family memories — sum of everything the parent has captured about
      // the family: voice clips, family events, and all per-member media
      // (photos, videos, stories). Covers both the legacy family_photos /
      // family_narratives tables and the newer family_member_* tables that
      // the current Family UI writes to.
      const memoriesResult = await queryOne<{ count: string }>(
        `SELECT (
           COALESCE((SELECT COUNT(*) FROM voice_clips WHERE user_id = $1), 0) +
           COALESCE((SELECT COUNT(*) FROM family_events WHERE user_id = $1), 0) +
           COALESCE((SELECT COUNT(*) FROM family_photos WHERE user_id = $1), 0) +
           COALESCE((SELECT COUNT(*) FROM family_narratives WHERE user_id = $1), 0) +
           COALESCE((SELECT COUNT(*) FROM family_member_photos fmp
                     INNER JOIN family_members fm ON fm.id = fmp.family_member_id
                     WHERE fm.user_id = $1), 0) +
           COALESCE((SELECT COUNT(*) FROM family_member_videos fmv
                     INNER JOIN family_members fm ON fm.id = fmv.family_member_id
                     WHERE fm.user_id = $1), 0) +
           COALESCE((SELECT COUNT(*) FROM family_member_stories fms
                     INNER JOIN family_members fm ON fm.id = fms.family_member_id
                     WHERE fm.user_id = $1), 0)
         )::text AS count`,
        [userId]
      );

      // Stories created across all children (lifetime, not just this week).
      const storiesCreatedResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM stories s
         INNER JOIN child_profiles cp ON cp.id = s.child_profile_id
         WHERE cp.user_id = $1`,
        [userId]
      );

      // Active journeys — across all children, status = 'active'.
      const activeJourneysResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM journeys j
         INNER JOIN child_profiles cp ON cp.id = j.child_profile_id
         WHERE cp.user_id = $1 AND j.status = 'active'`,
        [userId]
      );

      res.json({
        children: childStats,
        total_children: childrenResult.rows.length,
        topics_explored: parseInt(topicsResult?.count || '0', 10),
        family_memories: parseInt(memoriesResult?.count || '0', 10),
        stories_created: parseInt(storiesCreatedResult?.count || '0', 10),
        active_journeys: parseInt(activeJourneysResult?.count || '0', 10),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
