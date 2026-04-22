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

    const result = await query<Story & { child_name: string }>(
      `SELECT s.*, cp.name as child_name FROM stories s
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

// GET /api/stories/reading-progress
// Must be BEFORE /:id so Express doesn't treat "reading-progress" as a UUID.
router.get('/reading-progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const result = await query<{
      story_id: string;
      child_profile_id: string;
      last_page_read: number;
      total_pages: number;
      updated_at: string;
    }>(
      `SELECT srp.story_id, srp.child_profile_id, srp.last_page_read,
              srp.total_pages, srp.updated_at::text
       FROM story_reading_progress srp
       INNER JOIN child_profiles cp ON cp.id = srp.child_profile_id
       WHERE cp.user_id = $1
       ORDER BY srp.updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
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

// ─── Reading Progress ──────────────────────────────────────────────

/**
 * POST /api/stories/:storyId/progress
 * Upsert reading progress for a child. Called from StorybookReader on
 * every page flip (fire-and-forget) and on close.
 */
router.post('/:storyId/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyId } = req.params;
    const { child_profile_id, last_page_read, total_pages } = req.body;
    const userId = req.user!.id;

    if (!child_profile_id || last_page_read == null || total_pages == null) {
      throw new AppError(400, 'child_profile_id, last_page_read, and total_pages are required');
    }

    // Verify child belongs to user
    const child = await queryOne<{ id: string }>(
      'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
      [child_profile_id, userId]
    );
    if (!child) {
      throw new AppError(404, 'Child profile not found');
    }

    await queryOne(
      `INSERT INTO story_reading_progress (child_profile_id, story_id, last_page_read, total_pages)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (child_profile_id, story_id)
       DO UPDATE SET
         last_page_read = GREATEST(story_reading_progress.last_page_read, $3),
         total_pages = $4,
         updated_at = now()
       RETURNING id`,
      [child_profile_id, storyId, last_page_read, total_pages]
    );

    // When a kid finishes a PARENT-created story, auto-create a story_read
    // moment so they can share the milestone. Kid-created stories already
    // got a story_created moment at creation, so they're skipped here to
    // avoid double-moments for the same story. Fire-and-forget: failures
    // here must never break the progress upsert.
    if (total_pages > 0 && last_page_read >= total_pages) {
      (async () => {
        try {
          const story = await queryOne<{ title: string; theme: string | null; created_by: string | null }>(
            `SELECT title, theme, created_by FROM stories WHERE id = $1`,
            [storyId]
          );
          if (!story || story.created_by !== 'parent') return;

          const existing = await queryOne<{ id: string }>(
            `SELECT id FROM shared_moments
             WHERE child_profile_id = $1 AND moment_type = 'story_read' AND reference_id = $2::uuid`,
            [child_profile_id, storyId]
          );
          if (existing) return;

          await query(
            `INSERT INTO shared_moments
               (child_profile_id, user_id, moment_type, title, context, reference_id, is_seen, is_auto)
             VALUES ($1, $2, 'story_read', $3, $4, $5, true, true)`,
            [
              child_profile_id,
              userId,
              `Read "${story.title}"`,
              `Finished reading "${story.title}"${story.theme ? ` — a ${story.theme} adventure` : ''}.`,
              storyId,
            ]
          );
        } catch (err) {
          console.error('Error creating story_read moment:', (err as Error).message);
        }
      })();
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stories/:storyId/progress/:childId
 * Get reading progress for a specific child + story.
 */
router.get('/:storyId/progress/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyId, childId } = req.params;
    const userId = req.user!.id;

    const child = await queryOne<{ id: string }>(
      'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
      [childId, userId]
    );
    if (!child) {
      throw new AppError(404, 'Child profile not found');
    }

    const progress = await queryOne<{
      last_page_read: number;
      total_pages: number;
      updated_at: string;
    }>(
      `SELECT last_page_read, total_pages, updated_at::text
       FROM story_reading_progress
       WHERE child_profile_id = $1 AND story_id = $2`,
      [childId, storyId]
    );

    res.json(progress || { last_page_read: 0, total_pages: 0 });
  } catch (error) {
    next(error);
  }
});

export default router;
