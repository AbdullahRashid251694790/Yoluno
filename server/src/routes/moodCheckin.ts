/**
 * Mood Check-in Routes
 *
 * Handles mood tracking for child check-ins.
 * Used for daily mood logging and parent insights.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Types
type MoodType = 'happy' | 'sad' | 'angry' | 'scared' | 'calm';

interface MoodCheckin {
  id: string;
  child_profile_id: string;
  mood: MoodType;
  luno_response: string | null;
  suggested_activity: string | null;
  session_id: string | null;
  created_at: string;
}

interface MoodHistoryEntry {
  date: string;
  mood: MoodType;
  created_at: string;
}

interface MoodDistribution {
  mood: MoodType;
  count: number;
  percentage: number;
}

interface MoodCalendarEntry {
  date: string;
  moods: MoodType[];
  dominant_mood: MoodType | null;
}

/**
 * Helper: Verify child belongs to user
 */
async function verifyChildOwnership(childId: string, userId: string): Promise<boolean> {
  const child = await queryOne<{ id: string }>(
    'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  return !!child;
}

/**
 * POST /api/mood-checkin/:childId
 * Log a mood check-in for a child
 */
router.post(
  '/:childId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { mood, luno_response, suggested_activity } = req.body;

      // Validate mood
      const validMoods: MoodType[] = ['happy', 'sad', 'angry', 'scared', 'calm'];
      if (!mood || !validMoods.includes(mood)) {
        throw new AppError(400, 'Invalid mood. Must be one of: happy, sad, angry, scared, calm');
      }

      // Verify child belongs to user
      if (!(await verifyChildOwnership(childId, userId))) {
        throw new AppError(404, 'Child profile not found');
      }

      // Insert mood check-in
      const result = await queryOne<MoodCheckin>(
        `INSERT INTO mood_checkins (child_profile_id, mood, luno_response, suggested_activity)
         VALUES ($1, $2, $3, $4)
         RETURNING id, child_profile_id, mood, luno_response, suggested_activity, session_id, created_at::text`,
        [childId, mood, luno_response || null, suggested_activity || null]
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/mood-checkin/:childId/today
 * Get today's mood check-in for a child (if exists)
 */
router.get(
  '/:childId/today',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      if (!(await verifyChildOwnership(childId, userId))) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get today's mood check-in
      const result = await queryOne<MoodCheckin>(
        `SELECT id, child_profile_id, mood, luno_response, suggested_activity, session_id, created_at::text
         FROM mood_checkins
         WHERE child_profile_id = $1
           AND created_at::date = CURRENT_DATE
         ORDER BY created_at DESC
         LIMIT 1`,
        [childId]
      );

      res.json(result || null);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/mood-checkin/:childId/history
 * Get mood history for a child
 */
router.get(
  '/:childId/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { days = '30' } = req.query;
      const daysNum = Math.min(parseInt(days as string, 10) || 30, 90);

      // Verify child belongs to user
      if (!(await verifyChildOwnership(childId, userId))) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get mood history
      const result = await query<MoodHistoryEntry>(
        `SELECT
           created_at::date::text as date,
           mood,
           created_at::text
         FROM mood_checkins
         WHERE child_profile_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '${daysNum} days'
         ORDER BY created_at DESC`,
        [childId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/mood-checkin/:childId/summary
 * Get mood summary/statistics for a child
 */
router.get(
  '/:childId/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { days = '7' } = req.query;
      const daysNum = Math.min(parseInt(days as string, 10) || 7, 90);

      // Verify child belongs to user
      if (!(await verifyChildOwnership(childId, userId))) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get total check-ins and distribution
      const distributionResult = await query<{ mood: MoodType; count: string }>(
        `SELECT mood, COUNT(*)::text as count
         FROM mood_checkins
         WHERE child_profile_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '${daysNum} days'
         GROUP BY mood
         ORDER BY count DESC`,
        [childId]
      );

      // Calculate total and percentages
      const totalCheckins = distributionResult.rows.reduce(
        (sum, row) => sum + parseInt(row.count, 10),
        0
      );

      const distribution: MoodDistribution[] = distributionResult.rows.map((row) => ({
        mood: row.mood,
        count: parseInt(row.count, 10),
        percentage: totalCheckins > 0
          ? Math.round((parseInt(row.count, 10) / totalCheckins) * 100)
          : 0,
      }));

      // Get most common mood
      const mostCommonMood = distribution.length > 0 ? distribution[0].mood : null;

      // Get recent pattern (last 7 entries)
      const recentResult = await query<{ mood: MoodType }>(
        `SELECT mood
         FROM mood_checkins
         WHERE child_profile_id = $1
         ORDER BY created_at DESC
         LIMIT 7`,
        [childId]
      );
      const recentPattern = recentResult.rows.map((r) => r.mood);

      res.json({
        total_checkins: totalCheckins,
        most_common_mood: mostCommonMood,
        distribution,
        recent_pattern: recentPattern,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/mood-checkin/:childId/calendar
 * Get mood calendar data for a child (for calendar visualization)
 */
router.get(
  '/:childId/calendar',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { month } = req.query; // Format: YYYY-MM

      // Validate month format
      if (!month || !/^\d{4}-\d{2}$/.test(month as string)) {
        throw new AppError(400, 'Invalid month format. Use YYYY-MM');
      }

      // Verify child belongs to user
      if (!(await verifyChildOwnership(childId, userId))) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get all moods for the month grouped by date
      const result = await query<{ date: string; moods: MoodType[] }>(
        `SELECT
           created_at::date::text as date,
           array_agg(mood ORDER BY created_at) as moods
         FROM mood_checkins
         WHERE child_profile_id = $1
           AND to_char(created_at, 'YYYY-MM') = $2
         GROUP BY created_at::date
         ORDER BY date`,
        [childId, month]
      );

      // Calculate dominant mood for each day
      const calendarEntries: MoodCalendarEntry[] = result.rows.map((row) => {
        const moodCounts: Record<MoodType, number> = {
          happy: 0,
          sad: 0,
          angry: 0,
          scared: 0,
          calm: 0,
        };
        row.moods.forEach((mood) => {
          moodCounts[mood]++;
        });

        let dominantMood: MoodType | null = null;
        let maxCount = 0;
        (Object.entries(moodCounts) as [MoodType, number][]).forEach(([mood, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantMood = mood;
          }
        });

        return {
          date: row.date,
          moods: row.moods,
          dominant_mood: dominantMood,
        };
      });

      res.json(calendarEntries);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/mood-checkin/:childId/distribution
 * Get mood distribution for analytics
 */
router.get(
  '/:childId/distribution',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { days = '7' } = req.query;
      const daysNum = Math.min(parseInt(days as string, 10) || 7, 90);

      // Verify child belongs to user
      if (!(await verifyChildOwnership(childId, userId))) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get distribution
      const result = await query<{ mood: MoodType; count: string }>(
        `SELECT mood, COUNT(*)::text as count
         FROM mood_checkins
         WHERE child_profile_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '${daysNum} days'
         GROUP BY mood`,
        [childId]
      );

      // Calculate total for percentages
      const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

      const distribution: MoodDistribution[] = result.rows.map((row) => ({
        mood: row.mood,
        count: parseInt(row.count, 10),
        percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 100) : 0,
      }));

      res.json(distribution);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
