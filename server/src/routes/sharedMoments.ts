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

const router = Router();
router.use(requireAuth);

interface SharedMomentRow {
  id: string;
  child_profile_id: string;
  user_id: string;
  moment_type: 'journey_complete' | 'story_created' | 'story_read' | 'curiosity' | 'family_listen' | 'mood_checkin';
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
 * POST /api/shared-moments/:id/share
 * Promote an auto-created moment to a manually-shared one so it appears
 * on the parent dashboard. Flips is_auto → false and is_seen → false.
 */
router.post('/:id/share', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const row = await queryOne<SharedMomentRow>(
      `UPDATE shared_moments sm
       SET is_auto = false, is_seen = false, shared_at = NOW()
       WHERE sm.id = $1 AND sm.user_id = $2
       RETURNING sm.id, sm.child_profile_id, sm.user_id, sm.moment_type,
                 sm.title, sm.context, sm.reflection, sm.reference_id,
                 sm.is_seen, sm.is_auto, sm.shared_at::text`,
      [req.params.id, userId]
    );
    if (!row) {
      throw new AppError(404, 'Shared moment not found');
    }
    res.json(row);
  } catch (error) {
    next(error);
  }
});

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
