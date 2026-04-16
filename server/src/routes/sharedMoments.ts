/**
 * Shared Moments Routes
 *
 * Endpoints for children to share journey completions, stories, and reads
 * with their parent, and for the parent to view/dismiss them.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { validateBody } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  child_profile_id: z.string().uuid(),
  moment_type: z.enum(['journey_complete', 'story_created', 'story_read']),
  title: z.string().min(1).max(200),
  context: z.string().max(500).optional(),
  reflection: z.string().max(500).optional(),
  reference_id: z.string().uuid().optional(),
});

interface SharedMomentRow {
  id: string;
  child_profile_id: string;
  user_id: string;
  moment_type: 'journey_complete' | 'story_created' | 'story_read';
  title: string;
  context: string | null;
  reflection: string | null;
  reference_id: string | null;
  is_seen: boolean;
  is_auto: boolean;
  shared_at: string;
  child_name: string;
}

/**
 * GET /api/shared-moments
 * List unseen shared moments for the authenticated parent, newest first.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { include_seen, childId } = req.query;

    const includeSeenFlag = include_seen === 'true';
    const childFilter = typeof childId === 'string' && childId.length > 0 ? childId : null;

    const params: string[] = [userId];
    let childClause = '';
    if (childFilter) {
      params.push(childFilter);
      childClause = `AND sm.child_profile_id = $${params.length}`;
    }

    const rows = await query<SharedMomentRow>(
      `SELECT sm.id, sm.child_profile_id, sm.user_id, sm.moment_type,
              sm.title, sm.context, sm.reflection, sm.reference_id,
              sm.is_seen, sm.is_auto, sm.shared_at::text, cp.name AS child_name
       FROM shared_moments sm
       INNER JOIN child_profiles cp ON cp.id = sm.child_profile_id
       WHERE sm.user_id = $1
         ${includeSeenFlag ? '' : 'AND sm.is_seen = false'}
         ${childFilter ? '' : 'AND sm.is_auto = false'}
         ${childClause}
       ORDER BY sm.shared_at DESC
       LIMIT 50`,
      params
    );

    res.json(rows.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shared-moments
 * Create a new shared moment — called from kids flows when a child taps
 * "Share with parent". The child must belong to the authenticated parent
 * (we rely on the same session since kids mode runs under the parent auth).
 */
router.post(
  '/',
  validateBody(createSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const {
        child_profile_id,
        moment_type,
        title,
        context,
        reflection,
        reference_id,
      } = req.body;

      // Verify the child belongs to this user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [child_profile_id, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      const row = await queryOne<SharedMomentRow>(
        `INSERT INTO shared_moments
           (child_profile_id, user_id, moment_type, title, context, reflection, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, child_profile_id, user_id, moment_type, title, context, reflection,
                   reference_id, is_seen, shared_at::text`,
        [
          child_profile_id,
          userId,
          moment_type,
          title,
          context || null,
          reflection || null,
          reference_id || null,
        ]
      );

      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/shared-moments/:id/seen
 * Mark a shared moment as seen (dismiss it from the dashboard list).
 */
router.patch('/:id/seen', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const row = await queryOne<{ id: string }>(
      `UPDATE shared_moments
       SET is_seen = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, userId]
    );
    if (!row) {
      throw new AppError(404, 'Shared moment not found');
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
