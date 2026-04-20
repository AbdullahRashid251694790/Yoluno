import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivityForChild, awardJourneyCompletionBadge } from '../helpers/gamification.js';
import { resetDailyJourneys } from './childProfiles.js';
import type { Journey, JourneyStep, ChildProfile } from '../types/index.js';

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

// GET /api/journeys?childId=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, status } = req.query;

    if (childId) {
      await verifyChildAccess(childId as string, req.user!.id);
      // Safety net: ensure daily routines are reset before fetching
      await resetDailyJourneys(childId as string);
    }

    let queryText = `
      SELECT j.*, jt.description as template_description FROM journeys j
      JOIN child_profiles cp ON j.child_profile_id = cp.id
      LEFT JOIN journey_templates jt ON jt.id::text = j.template_id
      WHERE cp.user_id = $1
    `;
    const params: unknown[] = [req.user!.id];

    if (childId) {
      queryText += ` AND j.child_profile_id = $${params.length + 1}`;
      params.push(childId);
    }

    if (status) {
      queryText += ` AND j.status = $${params.length + 1}`;
      params.push(status);
    }

    queryText += ' ORDER BY j.created_at DESC';

    const result = await query<Journey>(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/journeys/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    res.json(journey);
  } catch (error) {
    next(error);
  }
});

// GET /api/journeys/:id/steps
router.get('/:id/steps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const steps = await query<JourneyStep>(
      'SELECT * FROM journey_steps WHERE journey_id = $1 ORDER BY step_order',
      [req.params.id]
    );

    res.json(steps.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/journeys
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { child_profile_id, title, template_id } = req.body;

    await verifyChildAccess(child_profile_id, req.user!.id);

    const id = uuidv4();
    const result = await queryOne<Journey>(
      `INSERT INTO journeys (id, child_profile_id, title, template_id, status, progress)
       VALUES ($1, $2, $3, $4, 'active', 0)
       RETURNING *`,
      [id, child_profile_id, title, template_id]
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/journeys/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, progress } = req.body;

    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const result = await queryOne<Journey>(
      `UPDATE journeys SET
        status = COALESCE($1, status),
        progress = COALESCE($2, progress),
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, progress, req.params.id]
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/journeys/:journeyId/steps/:stepId
router.put('/:journeyId/steps/:stepId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { progress, completed_at } = req.body;

    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.journeyId]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const result = await queryOne<JourneyStep>(
      `UPDATE journey_steps SET
        progress = COALESCE($1, progress),
        completed_at = COALESCE($2, completed_at),
        updated_at = NOW()
       WHERE id = $3 AND journey_id = $4
       RETURNING *`,
      [progress, completed_at, req.params.stepId, req.params.journeyId]
    );

    if (!result) {
      throw new AppError(404, 'Journey step not found');
    }

    // Auto-complete journey if all steps are done
    if (progress === 100) {
      const remaining = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM journey_steps
         WHERE journey_id = $1 AND (progress IS NULL OR progress < 100)`,
        [req.params.journeyId]
      );

      if (parseInt(remaining?.count || '0', 10) === 0) {
        await query(
          `UPDATE journeys SET status = 'completed', completed_at = NOW(), progress = 100
           WHERE id = $1`,
          [req.params.journeyId]
        );
        // Fire-and-forget: award points + generic badges + journey-specific badge + reward
        logActivityForChild(journey.child_profile_id, 'journey_completed', {
          journeyId: req.params.journeyId,
        }).catch((err) => console.error('Error logging journey completion:', err));
        awardJourneyCompletionBadge(journey.child_profile_id, req.params.journeyId)
          .catch((err) => console.error('Error awarding journey badge:', err));

        // Create journey reward
        (async () => {
          try {
            const existing = await queryOne<{ id: string }>(
              'SELECT id FROM journey_rewards WHERE child_profile_id = $1 AND journey_id = $2',
              [journey.child_profile_id, req.params.journeyId]
            );
            if (existing) return; // Already awarded

            let rewardImageUrl = '/images/default-reward.png';
            if (journey.template_id) {
              const template = await queryOne<{ reward_image_url: string | null }>(
                'SELECT reward_image_url FROM journey_templates WHERE id = $1',
                [journey.template_id]
              );
              if (template?.reward_image_url) rewardImageUrl = template.reward_image_url;
            }

            await query(
              `INSERT INTO journey_rewards (id, child_profile_id, journey_id, reward_image_url, reward_title, viewed)
               VALUES ($1, $2, $3, $4, $5, false)`,
              [uuidv4(), journey.child_profile_id, req.params.journeyId, rewardImageUrl, journey.title]
            );
          } catch (err) {
            console.error('Error creating journey reward:', (err as Error).message);
          }
        })();

        // Notify parent if they opted in
        (async () => {
          try {
            const prefs = await queryOne<{ notify_on_journey: boolean }>(
              'SELECT notify_on_journey FROM user_safety_settings WHERE user_id = $1',
              [req.user!.id]
            );
            if (prefs?.notify_on_journey === false) return;
            const child = await queryOne<{ name: string }>(
              'SELECT name FROM child_profiles WHERE id = $1',
              [journey.child_profile_id]
            );
            await query(
              `INSERT INTO parent_notifications (user_id, child_profile_id, notification_type, title, message)
               VALUES ($1, $2, 'journey_completed', $3, $4)`,
              [
                req.user!.id,
                journey.child_profile_id,
                `${child?.name || 'Your child'} completed a journey!`,
                `${child?.name || 'Your child'} just finished the "${journey.title}" journey. Check their progress in the dashboard!`,
              ]
            );
          } catch (err) {
            console.error('Error sending journey notification:', (err as Error).message);
          }
        })();

        // Auto-create a Growth Journal moment (dedup by journey id)
        (async () => {
          try {
            const existing = await queryOne<{ id: string }>(
              `SELECT id FROM shared_moments
               WHERE child_profile_id = $1 AND moment_type = 'journey_complete' AND reference_id = $2::uuid`,
              [journey.child_profile_id, req.params.journeyId]
            );
            if (existing) return;

            const stepCount = await queryOne<{ count: string }>(
              'SELECT COUNT(*)::text as count FROM journey_steps WHERE journey_id = $1',
              [req.params.journeyId]
            );

            await query(
              `INSERT INTO shared_moments
                 (child_profile_id, user_id, moment_type, title, context, reference_id, is_seen, is_auto)
               VALUES ($1, $2, 'journey_complete', $3, $4, $5, true, true)`,
              [
                journey.child_profile_id,
                req.user!.id,
                `Completed ${journey.title}`,
                `Finished all ${stepCount?.count || 'the'} steps of ${journey.title}.`,
                req.params.journeyId,
              ]
            );
          } catch (err) {
            console.error('Error creating journey moment:', (err as Error).message);
          }
        })();
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/journeys/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    await query('DELETE FROM journeys WHERE id = $1', [req.params.id]);

    res.json({ message: 'Journey deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/journeys/custom - Create journey with steps in one call
router.post('/custom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { child_profile_id, title, template_id, requires_image_proof, badge_emoji = '🏅', steps = [] } = req.body;

    await verifyChildAccess(child_profile_id, req.user!.id);

    const journeyId = uuidv4();
    const journey = await queryOne<Journey>(
      `INSERT INTO journeys (id, child_profile_id, title, template_id, status, progress, requires_image_proof, badge_emoji)
       VALUES ($1, $2, $3, $4, 'active', 0, $5, $6)
       RETURNING *`,
      [journeyId, child_profile_id, title, template_id, requires_image_proof ?? false, badge_emoji]
    );

    // Create a badge definition for this custom journey so it can be awarded on completion
    await query(
      `INSERT INTO badge_definitions
         (id, name, display_name, description, category, icon_url, requirement_type, requirement_value, requirement_metadata, sort_order, is_active)
       VALUES ($1, $2, $3, $4, 'journey', $5, 'journey_custom_completion', 1, $6, 300, true)`,
      [
        uuidv4(),
        `journey_complete_custom_${journeyId}`,
        title + ' Champion',
        'You completed the ' + title + ' journey! Amazing work! 🎉',
        badge_emoji,
        JSON.stringify({ journey_id: journeyId }),
      ]
    );

    // Create steps
    const createdSteps: JourneyStep[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = await queryOne<JourneyStep>(
        `INSERT INTO journey_steps (id, journey_id, title, description, step_order, progress)
         VALUES ($1, $2, $3, $4, $5, 0)
         RETURNING *`,
        [uuidv4(), journeyId, steps[i].title, steps[i].description || null, i + 1]
      );
      if (step) createdSteps.push(step);
    }

    res.status(201).json({ ...journey, steps: createdSteps });
  } catch (error) {
    next(error);
  }
});

// POST /api/journeys/:id/steps - Add step to journey
router.post('/:id/steps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, step_order } = req.body;

    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    // Get current max step order if not provided
    let order = step_order;
    if (order === undefined) {
      const maxStep = await queryOne<{ max_order: number }>(
        'SELECT COALESCE(MAX(step_order), 0) as max_order FROM journey_steps WHERE journey_id = $1',
        [req.params.id]
      );
      order = (maxStep?.max_order ?? 0) + 1;
    }

    const step = await queryOne<JourneyStep>(
      `INSERT INTO journey_steps (id, journey_id, title, description, step_order, progress)
       VALUES ($1, $2, $3, $4, $5, 0)
       RETURNING *`,
      [uuidv4(), req.params.id, title, description || null, order]
    );

    res.status(201).json(step);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/journeys/:journeyId/steps/:stepId - Remove step from journey
router.delete('/:journeyId/steps/:stepId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.journeyId]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const result = await query(
      'DELETE FROM journey_steps WHERE id = $1 AND journey_id = $2 RETURNING id',
      [req.params.stepId, req.params.journeyId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Journey step not found');
    }

    // Reorder remaining steps
    await query(
      `WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY step_order) as new_order
        FROM journey_steps WHERE journey_id = $1
      )
      UPDATE journey_steps js SET step_order = o.new_order
      FROM ordered o WHERE js.id = o.id`,
      [req.params.journeyId]
    );

    res.json({ message: 'Step deleted' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/journeys/:id/steps/reorder - Reorder steps
router.put('/:id/steps/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stepIds } = req.body;

    if (!Array.isArray(stepIds)) {
      throw new AppError(400, 'stepIds must be an array');
    }

    const journey = await queryOne<Journey & { user_id: string }>(
      `SELECT j.*, cp.user_id FROM journeys j
       JOIN child_profiles cp ON j.child_profile_id = cp.id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    if (journey.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    // Update step orders based on array position
    for (let i = 0; i < stepIds.length; i++) {
      await query(
        'UPDATE journey_steps SET step_order = $1, updated_at = NOW() WHERE id = $2 AND journey_id = $3',
        [i + 1, stepIds[i], req.params.id]
      );
    }

    const steps = await query<JourneyStep>(
      'SELECT * FROM journey_steps WHERE journey_id = $1 ORDER BY step_order',
      [req.params.id]
    );

    res.json(steps.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
