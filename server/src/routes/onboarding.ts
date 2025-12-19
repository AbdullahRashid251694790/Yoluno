/**
 * Onboarding Routes
 *
 * Child onboarding progress management.
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
interface OnboardingProgress {
  id: string;
  child_profile_id: string;
  completed_at: string | null;
  current_step: string | null;
  steps_completed: string[];
  skipped: boolean;
  created_at: string;
  updated_at: string;
}

// Validation schemas
const updateStepSchema = z.object({
  current_step: z.string().min(1),
  step_completed: z.string().optional(),
});

const completeOnboardingSchema = z.object({
  skipped: z.boolean().optional(),
});

/**
 * GET /api/onboarding/:childId
 * Get onboarding progress for a child
 */
router.get(
  '/:childId',
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

      // Get or create progress
      let progress = await queryOne<OnboardingProgress>(
        `SELECT id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text
        FROM onboarding_progress
        WHERE child_profile_id = $1`,
        [childId]
      );

      if (!progress) {
        // Create new progress
        progress = await queryOne<OnboardingProgress>(
          `INSERT INTO onboarding_progress (child_profile_id, current_step)
          VALUES ($1, 'welcome')
          RETURNING id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text`,
          [childId]
        );
      }

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/onboarding/:childId/step
 * Update onboarding step
 */
router.put(
  '/:childId/step',
  validateBody(updateStepSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { current_step, step_completed } = req.body;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );

      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get current progress
      let progress = await queryOne<OnboardingProgress>(
        `SELECT id, steps_completed FROM onboarding_progress WHERE child_profile_id = $1`,
        [childId]
      );

      if (!progress) {
        // Create new progress
        progress = await queryOne<OnboardingProgress>(
          `INSERT INTO onboarding_progress (child_profile_id, current_step, steps_completed)
          VALUES ($1, $2, $3)
          RETURNING id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text`,
          [childId, current_step, step_completed ? JSON.stringify([step_completed]) : '[]']
        );
      } else {
        // Update progress
        const stepsCompleted = progress.steps_completed || [];
        if (step_completed && !stepsCompleted.includes(step_completed)) {
          stepsCompleted.push(step_completed);
        }

        progress = await queryOne<OnboardingProgress>(
          `UPDATE onboarding_progress
          SET current_step = $2, steps_completed = $3
          WHERE child_profile_id = $1
          RETURNING id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text`,
          [childId, current_step, JSON.stringify(stepsCompleted)]
        );
      }

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/onboarding/:childId/complete
 * Mark onboarding as complete
 */
router.post(
  '/:childId/complete',
  validateBody(completeOnboardingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;
      const { skipped = false } = req.body;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );

      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      const progress = await queryOne<OnboardingProgress>(
        `UPDATE onboarding_progress
        SET completed_at = now(), skipped = $2
        WHERE child_profile_id = $1
        RETURNING id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text`,
        [childId, skipped]
      );

      if (!progress) {
        // Create completed progress if it doesn't exist
        const newProgress = await queryOne<OnboardingProgress>(
          `INSERT INTO onboarding_progress (child_profile_id, completed_at, skipped)
          VALUES ($1, now(), $2)
          RETURNING id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text`,
          [childId, skipped]
        );
        res.json(newProgress);
      } else {
        res.json(progress);
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/onboarding/:childId/reset
 * Reset onboarding progress (for testing or re-doing)
 */
router.post(
  '/:childId/reset',
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

      const progress = await queryOne<OnboardingProgress>(
        `UPDATE onboarding_progress
        SET completed_at = NULL, current_step = 'welcome', steps_completed = '[]', skipped = false
        WHERE child_profile_id = $1
        RETURNING id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text`,
        [childId]
      );

      if (!progress) {
        // Create new progress
        const newProgress = await queryOne<OnboardingProgress>(
          `INSERT INTO onboarding_progress (child_profile_id, current_step)
          VALUES ($1, 'welcome')
          RETURNING id, child_profile_id, completed_at::text, current_step, steps_completed, skipped, created_at::text, updated_at::text`,
          [childId]
        );
        res.json(newProgress);
      } else {
        res.json(progress);
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/onboarding/:childId/status
 * Quick check if onboarding is complete
 */
router.get(
  '/:childId/status',
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

      const progress = await queryOne<{ completed_at: string | null; skipped: boolean }>(
        `SELECT completed_at::text, skipped FROM onboarding_progress WHERE child_profile_id = $1`,
        [childId]
      );

      res.json({
        completed: !!progress?.completed_at,
        skipped: progress?.skipped || false,
        needs_onboarding: !progress?.completed_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
