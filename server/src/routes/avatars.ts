import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Avatar } from '../types/index.js';

const router = Router();

// Avatars can be accessed without auth (public resource)
router.use(optionalAuth);

// GET /api/avatars
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, is_premium } = req.query;

    let queryText = 'SELECT * FROM avatar_library WHERE 1=1';
    const params: unknown[] = [];

    if (category) {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (is_premium !== undefined) {
      params.push(is_premium === 'true');
      queryText += ` AND is_premium = $${params.length}`;
    }

    queryText += ' ORDER BY name';

    const result = await query<Avatar>(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/avatars/categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{ category: string }>(
      'SELECT DISTINCT category FROM avatar_library WHERE category IS NOT NULL ORDER BY category'
    );
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    next(error);
  }
});

// GET /api/avatars/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const avatar = await queryOne<Avatar>(
      'SELECT * FROM avatar_library WHERE id = $1',
      [req.params.id]
    );

    if (!avatar) {
      throw new AppError(404, 'Avatar not found');
    }

    res.json(avatar);
  } catch (error) {
    next(error);
  }
});

export default router;
