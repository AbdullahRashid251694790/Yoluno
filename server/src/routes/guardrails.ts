import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { GuardrailSettings, ChildProfile } from '../types/index.js';

const router = Router();

router.use(requireAuth);

async function verifyChildAccess(childId: string, userId: string): Promise<void> {
  const child = await queryOne<ChildProfile>(
    'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  if (!child) {
    throw new AppError(403, 'Access denied to child profile');
  }
}

// GET /api/guardrails/:childId
router.get('/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    let settings = await queryOne<GuardrailSettings>(
      'SELECT * FROM guardrail_settings WHERE child_profile_id = $1',
      [req.params.childId]
    );

    // Auto-create default settings if they don't exist
    if (!settings) {
      const id = uuidv4();
      settings = await queryOne<GuardrailSettings>(
        `INSERT INTO guardrail_settings (
          id, child_profile_id, max_session_time, break_interval
        ) VALUES ($1, $2, 30, 15)
        RETURNING *`,
        [id, req.params.childId]
      );
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PUT /api/guardrails/:childId
router.put('/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const {
      max_session_time,
      break_interval,
      content_filters,
      allowed_topics,
      blocked_topics,
    } = req.body;

    // Check if settings exist
    const existing = await queryOne<GuardrailSettings>(
      'SELECT id FROM guardrail_settings WHERE child_profile_id = $1',
      [req.params.childId]
    );

    let result: GuardrailSettings | null;

    if (existing) {
      result = await queryOne<GuardrailSettings>(
        `UPDATE guardrail_settings SET
          max_session_time = COALESCE($1, max_session_time),
          break_interval = COALESCE($2, break_interval),
          content_filters = COALESCE($3, content_filters),
          allowed_topics = COALESCE($4, allowed_topics),
          blocked_topics = COALESCE($5, blocked_topics),
          updated_at = NOW()
         WHERE child_profile_id = $6
         RETURNING *`,
        [max_session_time, break_interval, content_filters, allowed_topics, blocked_topics, req.params.childId]
      );
    } else {
      const id = uuidv4();
      result = await queryOne<GuardrailSettings>(
        `INSERT INTO guardrail_settings (
          id, child_profile_id, max_session_time, break_interval,
          content_filters, allowed_topics, blocked_topics
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [id, req.params.childId, max_session_time || 30, break_interval || 15,
         content_filters, allowed_topics, blocked_topics]
      );
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
