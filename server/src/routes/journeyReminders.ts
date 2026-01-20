import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ChildProfile } from '../types/index.js';

const router = Router();

router.use(requireAuth);

interface ReminderSettings {
  id: string;
  child_profile_id: string;
  reminders_enabled: boolean;
  reminder_interval_hours: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_reminders_per_day: number;
  reminder_tone: 'encouraging' | 'playful' | 'gentle';
  created_at: string;
  updated_at: string;
}

interface JourneyReminder {
  id: string;
  child_profile_id: string;
  journey_id: string;
  journey_step_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  message_content: string | null;
  status: 'pending' | 'sent' | 'skipped' | 'cancelled';
  created_at: string;
}

async function verifyChildAccess(childId: string, userId: string): Promise<void> {
  const child = await queryOne<ChildProfile>(
    'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  if (!child) {
    throw new AppError(403, 'Access denied to child profile');
  }
}

const DEFAULT_SETTINGS = {
  reminders_enabled: true,
  reminder_interval_hours: 24,
  quiet_hours_start: '20:00',
  quiet_hours_end: '08:00',
  max_reminders_per_day: 3,
  reminder_tone: 'encouraging' as const,
};

// GET /api/journey-reminders/settings/:childId - Get reminder settings
router.get('/settings/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    let settings = await queryOne<ReminderSettings>(
      'SELECT * FROM journey_reminder_settings WHERE child_profile_id = $1',
      [req.params.childId]
    );

    // Auto-create default settings if not found
    if (!settings) {
      settings = await queryOne<ReminderSettings>(
        `INSERT INTO journey_reminder_settings
         (id, child_profile_id, reminders_enabled, reminder_interval_hours,
          quiet_hours_start, quiet_hours_end, max_reminders_per_day, reminder_tone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          uuidv4(),
          req.params.childId,
          DEFAULT_SETTINGS.reminders_enabled,
          DEFAULT_SETTINGS.reminder_interval_hours,
          DEFAULT_SETTINGS.quiet_hours_start,
          DEFAULT_SETTINGS.quiet_hours_end,
          DEFAULT_SETTINGS.max_reminders_per_day,
          DEFAULT_SETTINGS.reminder_tone,
        ]
      );
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PUT /api/journey-reminders/settings/:childId - Update reminder settings
router.put('/settings/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const {
      reminders_enabled,
      reminder_interval_hours,
      quiet_hours_start,
      quiet_hours_end,
      max_reminders_per_day,
      reminder_tone,
    } = req.body;

    // Check if settings exist
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM journey_reminder_settings WHERE child_profile_id = $1',
      [req.params.childId]
    );

    let settings: ReminderSettings | null;

    if (existing) {
      settings = await queryOne<ReminderSettings>(
        `UPDATE journey_reminder_settings SET
          reminders_enabled = COALESCE($1, reminders_enabled),
          reminder_interval_hours = COALESCE($2, reminder_interval_hours),
          quiet_hours_start = COALESCE($3, quiet_hours_start),
          quiet_hours_end = COALESCE($4, quiet_hours_end),
          max_reminders_per_day = COALESCE($5, max_reminders_per_day),
          reminder_tone = COALESCE($6, reminder_tone),
          updated_at = NOW()
         WHERE child_profile_id = $7
         RETURNING *`,
        [
          reminders_enabled,
          reminder_interval_hours,
          quiet_hours_start,
          quiet_hours_end,
          max_reminders_per_day,
          reminder_tone,
          req.params.childId,
        ]
      );
    } else {
      settings = await queryOne<ReminderSettings>(
        `INSERT INTO journey_reminder_settings
         (id, child_profile_id, reminders_enabled, reminder_interval_hours,
          quiet_hours_start, quiet_hours_end, max_reminders_per_day, reminder_tone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          uuidv4(),
          req.params.childId,
          reminders_enabled ?? DEFAULT_SETTINGS.reminders_enabled,
          reminder_interval_hours ?? DEFAULT_SETTINGS.reminder_interval_hours,
          quiet_hours_start ?? DEFAULT_SETTINGS.quiet_hours_start,
          quiet_hours_end ?? DEFAULT_SETTINGS.quiet_hours_end,
          max_reminders_per_day ?? DEFAULT_SETTINGS.max_reminders_per_day,
          reminder_tone ?? DEFAULT_SETTINGS.reminder_tone,
        ]
      );
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-reminders/:childId - Get scheduled reminders
router.get('/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const { status } = req.query;

    let queryText = `
      SELECT jr.*, j.title as journey_title, js.type as step_title
      FROM journey_reminders jr
      LEFT JOIN journeys j ON jr.journey_id = j.id
      LEFT JOIN journey_steps js ON jr.journey_step_id = js.id
      WHERE jr.child_profile_id = $1
    `;
    const params: unknown[] = [req.params.childId];

    if (status) {
      queryText += ` AND jr.status = $2`;
      params.push(status);
    }

    queryText += ' ORDER BY jr.scheduled_at ASC';

    const result = await query<JourneyReminder & { journey_title: string; step_title: string }>(
      queryText,
      params
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/journey-reminders/:childId/schedule - Manually trigger reminder scheduling
router.post('/:childId/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const { journey_id } = req.body;

    // Get reminder settings
    const settings = await queryOne<ReminderSettings>(
      'SELECT * FROM journey_reminder_settings WHERE child_profile_id = $1',
      [req.params.childId]
    );

    if (!settings || !settings.reminders_enabled) {
      res.json({ message: 'Reminders disabled', scheduled: 0 });
      return;
    }

    // Get active journeys (or specific journey)
    let journeyQuery = `
      SELECT j.id, j.title, js.id as step_id, js.type as step_title
      FROM journeys j
      LEFT JOIN journey_steps js ON j.id = js.journey_id AND js.progress < 100
      WHERE j.child_profile_id = $1 AND j.status = 'active'
    `;
    const params: unknown[] = [req.params.childId];

    if (journey_id) {
      journeyQuery += ' AND j.id = $2';
      params.push(journey_id);
    }

    journeyQuery += ' ORDER BY j.created_at, js.step_order LIMIT 10';

    const journeys = await query<{
      id: string;
      title: string;
      step_id: string | null;
      step_title: string | null;
    }>(journeyQuery, params);

    // Schedule reminders
    const scheduledAt = new Date();
    scheduledAt.setHours(scheduledAt.getHours() + settings.reminder_interval_hours);

    let scheduled = 0;
    for (const j of journeys.rows) {
      // Check if reminder already exists for this journey
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM journey_reminders
         WHERE child_profile_id = $1 AND journey_id = $2 AND status = 'pending'`,
        [req.params.childId, j.id]
      );

      if (!existing) {
        await query(
          `INSERT INTO journey_reminders
           (id, child_profile_id, journey_id, journey_step_id, scheduled_at, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')`,
          [uuidv4(), req.params.childId, j.id, j.step_id, scheduledAt]
        );
        scheduled++;
      }
    }

    res.json({ message: 'Reminders scheduled', scheduled });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/journey-reminders/:reminderId - Cancel a specific reminder
router.delete('/:reminderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify access through child profile
    const reminder = await queryOne<JourneyReminder & { user_id: string }>(
      `SELECT jr.*, cp.user_id FROM journey_reminders jr
       JOIN child_profiles cp ON jr.child_profile_id = cp.id
       WHERE jr.id = $1`,
      [req.params.reminderId]
    );

    if (!reminder) {
      throw new AppError(404, 'Reminder not found');
    }

    if (reminder.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    await query(
      `UPDATE journey_reminders SET status = 'cancelled' WHERE id = $1`,
      [req.params.reminderId]
    );

    res.json({ message: 'Reminder cancelled' });
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-reminders/:childId/due - Get due reminders (used by buddy chat)
router.get('/:childId/due', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const result = await query<JourneyReminder & { journey_title: string; step_title: string }>(
      `SELECT jr.*, j.title as journey_title, js.type as step_title
       FROM journey_reminders jr
       LEFT JOIN journeys j ON jr.journey_id = j.id
       LEFT JOIN journey_steps js ON jr.journey_step_id = js.id
       WHERE jr.child_profile_id = $1
         AND jr.status = 'pending'
         AND jr.scheduled_at <= NOW()
       ORDER BY jr.scheduled_at ASC
       LIMIT 5`,
      [req.params.childId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// PUT /api/journey-reminders/:reminderId/sent - Mark reminder as sent
router.put('/:reminderId/sent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminder = await queryOne<JourneyReminder & { user_id: string }>(
      `SELECT jr.*, cp.user_id FROM journey_reminders jr
       JOIN child_profiles cp ON jr.child_profile_id = cp.id
       WHERE jr.id = $1`,
      [req.params.reminderId]
    );

    if (!reminder) {
      throw new AppError(404, 'Reminder not found');
    }

    if (reminder.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const { message_content } = req.body;

    await query(
      `UPDATE journey_reminders SET status = 'sent', sent_at = NOW(), message_content = $1 WHERE id = $2`,
      [message_content, req.params.reminderId]
    );

    res.json({ message: 'Reminder marked as sent' });
  } catch (error) {
    next(error);
  }
});

export default router;
