/**
 * Kids Mode Routes
 *
 * Kids mode configuration, personality configs, and story settings.
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
interface KidsModeConfig {
  id: string;
  mode_key: string;
  label: string;
  description: string | null;
  icon_name: string;
  color_class: string;
  route_path: string;
  is_enabled: boolean;
  display_order: number;
}

interface PersonalityConfig {
  id: string;
  mode_key: string;
  label: string;
  description: string;
  emoji: string;
  prompt_style: string;
  example_greeting: string | null;
  is_enabled: boolean;
  display_order: number;
}

interface StorySettings {
  id: string;
  child_profile_id: string;
  bedtime_enabled: boolean;
  auto_play_stories: boolean;
  dim_level: number;
  auto_advance_delay_seconds: number;
  preferred_voice: string;
  font_size: string;
  show_illustrations: boolean;
}

// Validation schemas
const updateStorySettingsSchema = z.object({
  bedtime_enabled: z.boolean().optional(),
  auto_play_stories: z.boolean().optional(),
  dim_level: z.number().int().min(0).max(100).optional(),
  auto_advance_delay_seconds: z.number().int().min(1).max(30).optional(),
  preferred_voice: z.string().optional(),
  font_size: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
  show_illustrations: z.boolean().optional(),
});

/**
 * GET /api/kids-mode/configs
 * Get all available kids mode configurations
 */
router.get(
  '/configs',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const configs = await query<KidsModeConfig>(
        `SELECT id, mode_key, label, description, icon_name, color_class, route_path, is_enabled, display_order
        FROM kids_mode_config
        WHERE is_enabled = true
        ORDER BY display_order`
      );

      res.json(configs);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/kids-mode/personalities
 * Get all available personality configurations
 */
router.get(
  '/personalities',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const configs = await query<PersonalityConfig>(
        `SELECT id, mode_key, label, description, emoji, prompt_style, example_greeting, is_enabled, display_order
        FROM personality_configs
        WHERE is_enabled = true
        ORDER BY display_order`
      );

      res.json(configs);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/kids-mode/personality/:key
 * Get a specific personality configuration
 */
router.get(
  '/personality/:key',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;

      const config = await queryOne<PersonalityConfig>(
        `SELECT id, mode_key, label, description, emoji, prompt_style, example_greeting, is_enabled, display_order
        FROM personality_configs
        WHERE mode_key = $1 AND is_enabled = true`,
        [key]
      );

      if (!config) {
        throw new AppError(404, 'Personality configuration not found');
      }

      res.json(config);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/kids-mode/story-settings/:childId
 * Get story settings for a child
 */
router.get(
  '/story-settings/:childId',
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

      // Get or create settings
      let settings = await queryOne<StorySettings>(
        `SELECT id, child_profile_id, bedtime_enabled, auto_play_stories, dim_level,
                auto_advance_delay_seconds, preferred_voice, font_size, show_illustrations
        FROM story_settings
        WHERE child_profile_id = $1`,
        [childId]
      );

      if (!settings) {
        // Create default settings
        settings = await queryOne<StorySettings>(
          `INSERT INTO story_settings (child_profile_id)
          VALUES ($1)
          RETURNING id, child_profile_id, bedtime_enabled, auto_play_stories, dim_level,
                    auto_advance_delay_seconds, preferred_voice, font_size, show_illustrations`,
          [childId]
        );
      }

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/kids-mode/story-settings/:childId
 * Update story settings for a child
 */
router.put(
  '/story-settings/:childId',
  validateBody(updateStorySettingsSchema),
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

      const {
        bedtime_enabled,
        auto_play_stories,
        dim_level,
        auto_advance_delay_seconds,
        preferred_voice,
        font_size,
        show_illustrations,
      } = req.body;

      // Build update query
      const updates: string[] = [];
      const params: (string | number | boolean)[] = [];
      let paramIndex = 1;

      if (bedtime_enabled !== undefined) {
        updates.push(`bedtime_enabled = $${paramIndex}`);
        params.push(bedtime_enabled);
        paramIndex++;
      }
      if (auto_play_stories !== undefined) {
        updates.push(`auto_play_stories = $${paramIndex}`);
        params.push(auto_play_stories);
        paramIndex++;
      }
      if (dim_level !== undefined) {
        updates.push(`dim_level = $${paramIndex}`);
        params.push(dim_level);
        paramIndex++;
      }
      if (auto_advance_delay_seconds !== undefined) {
        updates.push(`auto_advance_delay_seconds = $${paramIndex}`);
        params.push(auto_advance_delay_seconds);
        paramIndex++;
      }
      if (preferred_voice !== undefined) {
        updates.push(`preferred_voice = $${paramIndex}`);
        params.push(preferred_voice);
        paramIndex++;
      }
      if (font_size !== undefined) {
        updates.push(`font_size = $${paramIndex}`);
        params.push(font_size);
        paramIndex++;
      }
      if (show_illustrations !== undefined) {
        updates.push(`show_illustrations = $${paramIndex}`);
        params.push(show_illustrations);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No updates provided');
      }

      params.push(childId);

      const settings = await queryOne<StorySettings>(
        `UPDATE story_settings
        SET ${updates.join(', ')}
        WHERE child_profile_id = $${paramIndex}
        RETURNING id, child_profile_id, bedtime_enabled, auto_play_stories, dim_level,
                  auto_advance_delay_seconds, preferred_voice, font_size, show_illustrations`,
        params
      );

      if (!settings) {
        throw new AppError(404, 'Story settings not found');
      }

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
