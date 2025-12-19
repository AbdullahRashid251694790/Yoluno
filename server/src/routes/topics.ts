/**
 * Topics Routes
 *
 * Content topics management for parent controls.
 * All data from database - no hardcoding.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Types
interface TopicCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

interface Topic {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  age_appropriate_min: number;
  age_appropriate_max: number;
  is_default: boolean;
}

interface ChildTopicSetting {
  id: string;
  child_profile_id: string;
  topic_id: string;
  is_allowed: boolean;
  created_at: string;
}

// Validation schemas
const updateTopicSettingSchema = z.object({
  is_allowed: z.boolean(),
});

/**
 * GET /api/topics/categories
 * Get all topic categories with their topics
 */
router.get(
  '/categories',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get all categories
      const categoriesResult = await query<TopicCategory>(
        `SELECT id, name, description, icon, sort_order
        FROM topic_categories
        ORDER BY sort_order, name`
      );

      // Get all topics
      const topicsResult = await query<Topic>(
        `SELECT id, category_id, name, description,
                age_appropriate_min, age_appropriate_max, is_default
        FROM topics
        ORDER BY name`
      );

      const categories = categoriesResult.rows;
      const topics = topicsResult.rows;

      // Group topics by category
      const categoriesWithTopics = categories.map((category) => ({
        ...category,
        topics: topics.filter((t) => t.category_id === category.id),
      }));

      // Add uncategorized topics
      const uncategorizedTopics = topics.filter((t) => !t.category_id);
      if (uncategorizedTopics.length > 0) {
        categoriesWithTopics.push({
          id: 'uncategorized',
          name: 'Other',
          description: 'Miscellaneous topics',
          icon: null,
          sort_order: 999,
          topics: uncategorizedTopics,
        } as TopicCategory & { topics: Topic[] });
      }

      res.json(categoriesWithTopics);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/topics/child/:childId
 * Get topic settings for a specific child
 */
router.get(
  '/child/:childId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string; age: number }>(
        'SELECT id, age FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get all topics appropriate for child's age
      const topicsResult = await query<Topic & { category_name: string }>(
        `SELECT t.id, t.category_id, t.name, t.description,
                t.age_appropriate_min, t.age_appropriate_max, t.is_default,
                tc.name as category_name
        FROM topics t
        LEFT JOIN topic_categories tc ON t.category_id = tc.id
        WHERE t.age_appropriate_min <= $1 AND t.age_appropriate_max >= $1
        ORDER BY tc.sort_order, t.name`,
        [child.age]
      );

      // Get child's topic settings
      const settingsResult = await query<ChildTopicSetting>(
        `SELECT id, child_profile_id, topic_id, is_allowed, created_at::text
        FROM child_topic_settings
        WHERE child_profile_id = $1`,
        [childId]
      );

      // Build settings map
      const settingsMap = new Map(settingsResult.rows.map((s) => [s.topic_id, s.is_allowed]));

      // Merge topics with settings (default to is_default if no setting)
      const topicsWithSettings = topicsResult.rows.map((topic) => ({
        ...topic,
        is_allowed: settingsMap.has(topic.id)
          ? settingsMap.get(topic.id)
          : topic.is_default,
      }));

      res.json({
        child_id: childId,
        child_age: child.age,
        topics: topicsWithSettings,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/topics/child/:childId/:topicId
 * Update topic setting for a child
 */
router.put(
  '/child/:childId/:topicId',
  validateBody(updateTopicSettingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId, topicId } = req.params;
      const { is_allowed } = req.body;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Verify topic exists
      const topic = await queryOne<{ id: string }>(
        'SELECT id FROM topics WHERE id = $1',
        [topicId]
      );
      if (!topic) {
        throw new AppError(404, 'Topic not found');
      }

      // Upsert the setting
      const result = await queryOne<ChildTopicSetting>(
        `INSERT INTO child_topic_settings (child_profile_id, topic_id, is_allowed)
        VALUES ($1, $2, $3)
        ON CONFLICT (child_profile_id, topic_id)
        DO UPDATE SET is_allowed = EXCLUDED.is_allowed
        RETURNING id, child_profile_id, topic_id, is_allowed, created_at::text`,
        [childId, topicId, is_allowed]
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/topics/child/:childId/bulk
 * Bulk update topic settings for a child
 */
router.post(
  '/child/:childId/bulk',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const { settings } = req.body as { settings: Array<{ topic_id: string; is_allowed: boolean }> };
      const userId = req.user!.id;

      if (!Array.isArray(settings)) {
        throw new AppError(400, 'Settings must be an array');
      }

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Upsert all settings
      for (const setting of settings) {
        await query(
          `INSERT INTO child_topic_settings (child_profile_id, topic_id, is_allowed)
          VALUES ($1, $2, $3)
          ON CONFLICT (child_profile_id, topic_id)
          DO UPDATE SET is_allowed = EXCLUDED.is_allowed`,
          [childId, setting.topic_id, setting.is_allowed]
        );
      }

      res.json({ message: 'Settings updated', count: settings.length });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
