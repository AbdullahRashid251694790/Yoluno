/**
 * Safety Settings Routes
 *
 * Per-user safety notification preferences — controls whether dashboard
 * notifications fire for topic redirections, safety reports, and weekly
 * summaries.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

interface SafetySettings {
  notify_on_redirect: boolean;
  notify_on_report: boolean;
  weekly_summary: boolean;
  notify_on_journey: boolean;
  notify_on_story: boolean;
  auto_delete_days: number | null;
  last_export_at: string | null;
  last_delete_at: string | null;
}

const COLS = 'notify_on_redirect, notify_on_report, weekly_summary, notify_on_journey, notify_on_story, auto_delete_days, last_export_at, last_delete_at';

/**
 * GET /api/safety-settings
 * Returns the user's safety notification preferences. Auto-creates a row
 * with defaults if one doesn't exist yet.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    let settings = await queryOne<SafetySettings>(
      `SELECT ${COLS} FROM user_safety_settings WHERE user_id = $1`,
      [userId]
    );

    if (!settings) {
      settings = await queryOne<SafetySettings>(
        `INSERT INTO user_safety_settings (user_id) VALUES ($1)
         RETURNING ${COLS}`,
        [userId]
      );
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/safety-settings
 * Update one or more safety notification preferences.
 */
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { notify_on_redirect, notify_on_report, weekly_summary, notify_on_journey, notify_on_story, auto_delete_days } = req.body;

    // Upsert
    const settings = await queryOne<SafetySettings>(
      `INSERT INTO user_safety_settings (user_id, notify_on_redirect, notify_on_report, weekly_summary, notify_on_journey, notify_on_story, auto_delete_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         notify_on_redirect = COALESCE($2, user_safety_settings.notify_on_redirect),
         notify_on_report = COALESCE($3, user_safety_settings.notify_on_report),
         weekly_summary = COALESCE($4, user_safety_settings.weekly_summary),
         notify_on_journey = COALESCE($5, user_safety_settings.notify_on_journey),
         notify_on_story = COALESCE($6, user_safety_settings.notify_on_story),
         auto_delete_days = $7,
         updated_at = now()
       RETURNING ${COLS}`,
      [
        userId,
        notify_on_redirect ?? false,
        notify_on_report ?? true,
        weekly_summary ?? true,
        notify_on_journey ?? true,
        notify_on_story ?? false,
        auto_delete_days ?? null,
      ]
    );

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

export default router;
