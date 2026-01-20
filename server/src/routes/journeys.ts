import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
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
    }

    let queryText = `
      SELECT j.* FROM journeys j
      JOIN child_profiles cp ON j.child_profile_id = cp.id
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
    const { child_profile_id, title, template_id, requires_image_proof, steps = [] } = req.body;

    await verifyChildAccess(child_profile_id, req.user!.id);

    const journeyId = uuidv4();
    const journey = await queryOne<Journey>(
      `INSERT INTO journeys (id, child_profile_id, title, template_id, status, progress, requires_image_proof)
       VALUES ($1, $2, $3, $4, 'active', 0, $5)
       RETURNING *`,
      [journeyId, child_profile_id, title, template_id, requires_image_proof ?? false]
    );

    // Create steps
    const createdSteps: JourneyStep[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = await queryOne<JourneyStep>(
        `INSERT INTO journey_steps (id, journey_id, type, description, step_order, progress)
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
      `INSERT INTO journey_steps (id, journey_id, type, description, step_order, progress)
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
