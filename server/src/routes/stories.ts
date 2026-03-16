import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getFileUrl } from '../utils/storage.js';
import type { Story, ChildProfile } from '../types/index.js';

/** Resolve cover_image_url to signed S3 URL in production */
async function resolveStoryUrls(stories: Story[]): Promise<Story[]> {
  return Promise.all(
    stories.map(async (story) => {
      if (story.cover_image_url && !story.cover_image_url.startsWith('http')) {
        const url = await getFileUrl(story.cover_image_url, 3600);
        return { ...story, cover_image_url: url };
      }
      return story;
    })
  );
}

const router = Router();

router.use(requireAuth);

// Helper to verify child profile ownership
async function verifyChildAccess(childId: string, userId: string): Promise<void> {
  const child = await queryOne<ChildProfile>(
    'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  if (!child) {
    throw new AppError(403, 'Access denied to child profile');
  }
}

// GET /api/stories?childId=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, limit = '50', offset = '0' } = req.query;

    if (childId) {
      await verifyChildAccess(childId as string, req.user!.id);
    }

    const result = await query<Story>(
      `SELECT s.* FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE cp.user_id = $1
       ${childId ? 'AND s.child_profile_id = $2' : ''}
       ORDER BY s.created_at DESC
       LIMIT $${childId ? '3' : '2'} OFFSET $${childId ? '4' : '3'}`,
      childId
        ? [req.user!.id, childId, parseInt(limit as string), parseInt(offset as string)]
        : [req.user!.id, parseInt(limit as string), parseInt(offset as string)]
    );

    res.json(await resolveStoryUrls(result.rows));
  } catch (error) {
    next(error);
  }
});

// GET /api/stories/recent
router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query;

    const result = await query<Story>(
      `SELECT s.* FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE cp.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2`,
      [req.user!.id, parseInt(limit as string)]
    );

    res.json(await resolveStoryUrls(result.rows));
  } catch (error) {
    next(error);
  }
});

// GET /api/stories/favorites
router.get('/favorites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.query;

    if (childId) {
      await verifyChildAccess(childId as string, req.user!.id);
    }

    const result = await query<Story>(
      `SELECT s.* FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE cp.user_id = $1 AND s.is_favorite = true
       ${childId ? 'AND s.child_profile_id = $2' : ''}
       ORDER BY s.created_at DESC`,
      childId ? [req.user!.id, childId] : [req.user!.id]
    );

    res.json(await resolveStoryUrls(result.rows));
  } catch (error) {
    next(error);
  }
});

// GET /api/stories/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const story = await queryOne<Story & { user_id: string }>(
      `SELECT s.*, cp.user_id FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!story) {
      throw new AppError(404, 'Story not found');
    }

    if (story.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const [resolved] = await resolveStoryUrls([story]);
    res.json(resolved);
  } catch (error) {
    next(error);
  }
});

// POST /api/stories
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      child_profile_id,
      title,
      content,
      theme,
      mood,
      values,
      word_count,
      illustration_style,
      illustration_url,
    } = req.body;

    await verifyChildAccess(child_profile_id, req.user!.id);

    const id = uuidv4();
    const result = await queryOne<Story>(
      `INSERT INTO stories (
        id, child_profile_id, title, content, theme, mood,
        values, word_count, illustration_style, illustration_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [id, child_profile_id, title, content, theme, mood, values, word_count, illustration_style, illustration_url]
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/stories/:id/favorite
router.put('/:id/favorite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { is_favorite } = req.body;

    const story = await queryOne<Story & { user_id: string }>(
      `SELECT s.*, cp.user_id FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!story) {
      throw new AppError(404, 'Story not found');
    }

    if (story.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const result = await queryOne<Story>(
      `UPDATE stories SET is_favorite = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [is_favorite, req.params.id]
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/stories/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const story = await queryOne<Story & { user_id: string }>(
      `SELECT s.*, cp.user_id FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!story) {
      throw new AppError(404, 'Story not found');
    }

    if (story.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    await query('DELETE FROM stories WHERE id = $1', [req.params.id]);

    res.json({ message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
