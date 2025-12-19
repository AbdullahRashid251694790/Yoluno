/**
 * Journey Templates Routes
 *
 * API for browsing and using journey templates.
 * All templates come from database - no hardcoding.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction, PoolClient } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { z } from 'zod';
import type { ChildProfile } from '../types/index.js';

const router = Router();

router.use(requireAuth);

// Types for journey templates
interface JourneyTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  age_range_min: number;
  age_range_max: number;
  duration_days: number;
  difficulty: string | null;
  icon: string | null;
  is_featured: boolean;
  usage_count: number;
  created_at: string;
}

interface JourneyTemplateStep {
  id: string;
  template_id: string;
  step_order: number;
  title: string;
  description: string | null;
  type: string | null;
  content: Record<string, unknown>;
}

interface JourneyTemplateWithSteps extends JourneyTemplate {
  steps: JourneyTemplateStep[];
}

interface Journey {
  id: string;
  child_profile_id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

// Validation schemas
const createFromTemplateSchema = z.object({
  childId: z.string().uuid('Invalid child ID'),
  templateId: z.string().uuid('Invalid template ID'),
});

const listTemplatesSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  minAge: z.coerce.number().min(0).max(18).optional(),
  maxAge: z.coerce.number().min(0).max(18).optional(),
  featured: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

// Helper to verify child access
async function verifyChildAccess(childId: string, userId: string): Promise<ChildProfile> {
  const child = await queryOne<ChildProfile>(
    'SELECT * FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  if (!child) {
    throw new AppError(403, 'Access denied to child profile');
  }
  return child;
}

// GET /api/journey-templates - List all templates with optional filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = listTemplatesSchema.parse(req.query);

    let queryText = `
      SELECT * FROM journey_templates
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.category) {
      queryText += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.difficulty) {
      queryText += ` AND difficulty = $${paramIndex++}`;
      params.push(filters.difficulty);
    }

    if (filters.minAge !== undefined) {
      queryText += ` AND age_range_max >= $${paramIndex++}`;
      params.push(filters.minAge);
    }

    if (filters.maxAge !== undefined) {
      queryText += ` AND age_range_min <= $${paramIndex++}`;
      params.push(filters.maxAge);
    }

    if (filters.featured !== undefined) {
      queryText += ` AND is_featured = $${paramIndex++}`;
      params.push(filters.featured);
    }

    queryText += ' ORDER BY is_featured DESC, usage_count DESC, title ASC';

    if (filters.limit) {
      queryText += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      queryText += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await query<JourneyTemplate>(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-templates/categories - Get all categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{ category: string; count: number }>(
      `SELECT category, COUNT(*)::integer as count
       FROM journey_templates
       GROUP BY category
       ORDER BY count DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-templates/featured - Get featured templates
router.get('/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 6, 20);

    const result = await query<JourneyTemplate>(
      `SELECT * FROM journey_templates
       WHERE is_featured = true
       ORDER BY usage_count DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-templates/:id - Get a single template with steps
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await queryOne<JourneyTemplate>(
      'SELECT * FROM journey_templates WHERE id = $1',
      [req.params.id]
    );

    if (!template) {
      throw new AppError(404, 'Journey template not found');
    }

    const stepsResult = await query<JourneyTemplateStep>(
      `SELECT * FROM journey_template_steps
       WHERE template_id = $1
       ORDER BY step_order ASC`,
      [req.params.id]
    );

    const templateWithSteps: JourneyTemplateWithSteps = {
      ...template,
      steps: stepsResult.rows,
    };

    res.json(templateWithSteps);
  } catch (error) {
    next(error);
  }
});

// POST /api/journey-templates/:id/start - Create a journey from template
router.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = validateBody(
      z.object({ childId: z.string().uuid() }),
      req.body
    );

    // Verify child access
    const child = await verifyChildAccess(childId, req.user!.id);

    // Get the template
    const template = await queryOne<JourneyTemplate>(
      'SELECT * FROM journey_templates WHERE id = $1',
      [req.params.id]
    );

    if (!template) {
      throw new AppError(404, 'Journey template not found');
    }

    // Check age appropriateness
    if (child.age < template.age_range_min || child.age > template.age_range_max) {
      throw new AppError(
        400,
        `This journey is designed for ages ${template.age_range_min}-${template.age_range_max}`
      );
    }

    // Get template steps
    const templateSteps = await query<JourneyTemplateStep>(
      `SELECT * FROM journey_template_steps
       WHERE template_id = $1
       ORDER BY step_order ASC`,
      [req.params.id]
    );

    // Create journey and steps in a transaction
    const result = await withTransaction(async (client: PoolClient) => {
      const journeyId = uuidv4();

      // Create the journey
      const journeyResult = await client.query<Journey>(
        `INSERT INTO journeys (id, child_profile_id, template_id, title, description, status, progress)
         VALUES ($1, $2, $3, $4, $5, 'active', 0)
         RETURNING *`,
        [journeyId, childId, template.id, template.title, template.description]
      );

      const journey = journeyResult.rows[0];

      // Create journey steps from template steps
      for (const templateStep of templateSteps.rows) {
        const stepId = uuidv4();
        await client.query(
          `INSERT INTO journey_steps (id, journey_id, step_order, title, description, type, content, progress)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 0)`,
          [
            stepId,
            journeyId,
            templateStep.step_order,
            templateStep.title,
            templateStep.description,
            templateStep.type,
            JSON.stringify(templateStep.content),
          ]
        );
      }

      // Increment template usage count
      await client.query(
        'UPDATE journey_templates SET usage_count = usage_count + 1 WHERE id = $1',
        [template.id]
      );

      return journey;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-templates/for-child/:childId - Get templates appropriate for a child's age
router.get('/for-child/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const child = await verifyChildAccess(req.params.childId, req.user!.id);

    const result = await query<JourneyTemplate>(
      `SELECT * FROM journey_templates
       WHERE age_range_min <= $1 AND age_range_max >= $1
       ORDER BY is_featured DESC, usage_count DESC
       LIMIT 20`,
      [child.age]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
