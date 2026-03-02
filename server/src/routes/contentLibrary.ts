/**
 * Content Library Routes
 *
 * Unified content view for parents: stories, journeys, voice clips, and notes.
 * Pulls from multiple source tables via UNION queries.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

// Types
interface ContentRow {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  content_type: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  is_favorite: boolean;
  created_at: string;
  child_name: string | null;
}

// Validation schemas
const createContentSchema = z.object({
  child_profile_id: z.string().uuid().optional(),
  content_type: z.enum(['story', 'chat_snippet', 'journey', 'note']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
  is_favorite: z.boolean().optional(),
});

// --- Source query builders ---
// Each returns a SELECT with identical column shape for UNION compatibility.
// They use $1 = userId, $2 = childId (optional). The caller passes params accordingly.

function storySource(hasChild: boolean, hasFavorite: boolean): string {
  const childFilter = hasChild ? ' AND s.child_profile_id = $2' : '';
  const favFilter = hasFavorite ? ' AND s.is_favorite = true' : '';
  return `
    SELECT s.id, cp.user_id, s.child_profile_id, 'story'::text as content_type,
           s.title, LEFT(s.content, 300) as content,
           jsonb_build_object(
             'theme', s.theme, 'mood', s.mood,
             'word_count', s.word_count,
             'illustration_url', COALESCE(s.cover_image_url, s.illustration_url)
           ) as metadata,
           s.is_favorite, s.created_at,
           cp.name as child_name
    FROM stories s
    JOIN child_profiles cp ON s.child_profile_id = cp.id
    WHERE cp.user_id = $1${childFilter}${favFilter}`;
}

function journeySource(hasChild: boolean, hasFavorite: boolean): string {
  const childFilter = hasChild ? ' AND j.child_profile_id = $2' : '';
  // Journeys don't have is_favorite — exclude when filtering favorites
  if (hasFavorite) return '';
  return `
    SELECT j.id, cp.user_id, j.child_profile_id, 'journey'::text as content_type,
           j.title,
           CASE j.status
             WHEN 'completed' THEN 'Completed journey — all steps done!'
             WHEN 'active' THEN 'In progress — ' || COALESCE(j.progress, 0) || '% complete'
             WHEN 'paused' THEN 'Journey paused'
             ELSE 'Journey'
           END as content,
           jsonb_build_object(
             'status', j.status, 'progress', j.progress,
             'step_count', (SELECT COUNT(*) FROM journey_steps js WHERE js.journey_id = j.id)
           ) as metadata,
           false as is_favorite, j.created_at,
           cp.name as child_name
    FROM journeys j
    JOIN child_profiles cp ON j.child_profile_id = cp.id
    WHERE cp.user_id = $1${childFilter}`;
}

function voiceSource(hasChild: boolean, hasFavorite: boolean): string {
  const childFilter = hasChild ? ' AND vc.child_profile_id = $2' : '';
  const favFilter = hasFavorite ? ' AND vc.is_favorite = true' : '';
  return `
    SELECT vc.id, vc.user_id, vc.child_profile_id, 'voice'::text as content_type,
           vc.title,
           COALESCE(vc.description, vc.transcription, 'Voice recording') as content,
           jsonb_build_object(
             'category', vc.category,
             'duration_seconds', vc.duration_seconds,
             'audio_url', vc.audio_url,
             'play_count', vc.play_count
           ) as metadata,
           vc.is_favorite, vc.created_at,
           cp.name as child_name
    FROM voice_clips vc
    LEFT JOIN child_profiles cp ON vc.child_profile_id = cp.id
    WHERE vc.user_id = $1${childFilter}${favFilter}`;
}

// Allowed content_item sub-types (whitelist to prevent SQL injection)
const CONTENT_ITEM_TYPES = new Set(['chat_snippet', 'note']);

function contentItemSource(hasChild: boolean, hasFavorite: boolean, typeFilter?: string): string {
  const childFilter = hasChild ? ' AND c.child_profile_id = $2' : '';
  const favFilter = hasFavorite ? ' AND c.is_favorite = true' : '';
  const typeClause = typeFilter && CONTENT_ITEM_TYPES.has(typeFilter)
    ? ` AND c.content_type = '${typeFilter}'` : '';
  return `
    SELECT c.id, c.user_id, c.child_profile_id, c.content_type,
           c.title, c.content, c.metadata, c.is_favorite, c.created_at,
           cp.name as child_name
    FROM content_items c
    LEFT JOIN child_profiles cp ON c.child_profile_id = cp.id
    WHERE c.user_id = $1${childFilter}${favFilter}${typeClause}`;
}

/** Wrap a source SELECT into a COUNT(*) query to avoid duplicating WHERE clauses (DRY) */
function toCount(sourceSQL: string): string {
  if (!sourceSQL) return 'SELECT 0';
  return `SELECT COUNT(*) FROM (${sourceSQL}) _c`;
}

/**
 * GET /api/content-library
 * List all saved content for the user from all sources.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { childId, type, favorite, limit = '50', offset = '0' } = req.query;

    const hasChild = !!childId;
    const hasFavorite = favorite === 'true';
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    // Build params: $1 = userId, $2 = childId (if present), $3 = limit, $4 = offset
    const baseParams: unknown[] = [userId];
    if (hasChild) baseParams.push(childId);
    const limitIdx = baseParams.length + 1;
    const offsetIdx = baseParams.length + 2;
    const queryParams = [...baseParams, limitNum, offsetNum];

    let sources: string[] = [];

    if (type === 'story') {
      sources = [storySource(hasChild, hasFavorite)];
    } else if (type === 'journey') {
      const js = journeySource(hasChild, hasFavorite);
      if (js) sources = [js];
    } else if (type === 'voice') {
      sources = [voiceSource(hasChild, hasFavorite)];
    } else if (type === 'chat_snippet' || type === 'note') {
      sources = [contentItemSource(hasChild, hasFavorite, type as string)];
    } else {
      // All sources
      sources = [
        storySource(hasChild, hasFavorite),
        contentItemSource(hasChild, hasFavorite),
        voiceSource(hasChild, hasFavorite),
      ];
      const js = journeySource(hasChild, hasFavorite);
      if (js) sources.push(js);
    }

    const countParts = sources.map(toCount);

    // Data query
    let sql: string;
    if (sources.length === 0) {
      // Favorites filter excluded all sources (e.g. journey + favorites)
      sql = `SELECT null WHERE false`;
    } else if (sources.length === 1) {
      sql = `${sources[0]} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    } else {
      sql = `SELECT * FROM (${sources.join('\n UNION ALL \n')}) combined ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    }

    const items = await query<ContentRow>(sql, queryParams);

    // Count query
    const countSql = `SELECT (${countParts.map(p => `(${p})`).join(' + ')})::integer as count`;
    const countResult = await queryOne<{ count: number }>(countSql, baseParams);
    const total = countResult?.count ?? 0;

    res.json({
      items: items.rows,
      total,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/content-library/:id
 * Get a specific content item (searches all source tables)
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Try content_items first
    let item = await queryOne<ContentRow>(
      `SELECT c.id, c.user_id, c.child_profile_id, c.content_type,
              c.title, c.content, c.metadata, c.is_favorite, c.created_at::text,
              cp.name as child_name
       FROM content_items c
       LEFT JOIN child_profiles cp ON c.child_profile_id = cp.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    // Try stories
    if (!item) {
      item = await queryOne<ContentRow>(
        `SELECT s.id, cp.user_id, s.child_profile_id, 'story'::text as content_type,
                s.title, s.content,
                jsonb_build_object('theme', s.theme, 'mood', s.mood,
                  'word_count', s.word_count, 'illustration_url', s.illustration_url) as metadata,
                s.is_favorite, s.created_at::text,
                cp.name as child_name
         FROM stories s
         JOIN child_profiles cp ON s.child_profile_id = cp.id
         WHERE s.id = $1 AND cp.user_id = $2`,
        [id, userId]
      );
    }

    // Try journeys
    if (!item) {
      item = await queryOne<ContentRow>(
        `SELECT j.id, cp.user_id, j.child_profile_id, 'journey'::text as content_type,
                j.title,
                CASE j.status
                  WHEN 'completed' THEN 'Completed journey'
                  WHEN 'active' THEN 'In progress — ' || j.progress || '%'
                  ELSE j.status
                END as content,
                jsonb_build_object('status', j.status, 'progress', j.progress) as metadata,
                false as is_favorite, j.created_at::text,
                cp.name as child_name
         FROM journeys j
         JOIN child_profiles cp ON j.child_profile_id = cp.id
         WHERE j.id = $1 AND cp.user_id = $2`,
        [id, userId]
      );
    }

    // Try voice clips
    if (!item) {
      item = await queryOne<ContentRow>(
        `SELECT vc.id, vc.user_id, vc.child_profile_id, 'voice'::text as content_type,
                vc.title,
                COALESCE(vc.description, vc.transcription, 'Voice recording') as content,
                jsonb_build_object('category', vc.category, 'duration_seconds', vc.duration_seconds) as metadata,
                vc.is_favorite, vc.created_at::text,
                cp.name as child_name
         FROM voice_clips vc
         LEFT JOIN child_profiles cp ON vc.child_profile_id = cp.id
         WHERE vc.id = $1 AND vc.user_id = $2`,
        [id, userId]
      );
    }

    if (!item) {
      throw new AppError(404, 'Content not found');
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/content-library
 * Save new content (manual saves: notes, chat snippets)
 */
router.post(
  '/',
  validateBody(createContentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { child_profile_id, content_type, title, content, metadata = {} } = req.body;

      if (child_profile_id) {
        const child = await queryOne<{ id: string }>(
          'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
          [child_profile_id, userId]
        );
        if (!child) {
          throw new AppError(404, 'Child profile not found');
        }
      }

      const id = uuidv4();
      const item = await queryOne<ContentRow>(
        `INSERT INTO content_items (id, user_id, child_profile_id, content_type, title, content, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, child_profile_id, content_type, title, content, metadata, is_favorite, created_at::text`,
        [id, userId, child_profile_id || null, content_type, title, content, JSON.stringify(metadata)]
      );

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/content-library/:id/favorite
 * Toggle favorite status (searches all source tables that support it)
 */
router.put('/:id/favorite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Try content_items
    let item = await queryOne<ContentRow>(
      `UPDATE content_items SET is_favorite = NOT is_favorite
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, child_profile_id, content_type, title, content, metadata, is_favorite, created_at::text`,
      [id, userId]
    );
    if (item) return res.json(item);

    // Try stories
    item = await queryOne<ContentRow>(
      `UPDATE stories SET is_favorite = NOT is_favorite
       WHERE id = $1 AND child_profile_id IN (SELECT id FROM child_profiles WHERE user_id = $2)
       RETURNING id, child_profile_id, 'story'::text as content_type, title, LEFT(content, 300) as content,
                 '{}'::jsonb as metadata, is_favorite, created_at::text`,
      [id, userId]
    );
    if (item) return res.json(item);

    // Try voice clips
    item = await queryOne<ContentRow>(
      `UPDATE voice_clips SET is_favorite = NOT is_favorite
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, child_profile_id, 'voice'::text as content_type, title,
                 COALESCE(description, 'Voice recording') as content,
                 '{}'::jsonb as metadata, is_favorite, created_at::text`,
      [id, userId]
    );
    if (item) return res.json(item);

    throw new AppError(404, 'Content not found');
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/content-library/:id
 * Delete content (searches all source tables)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Try content_items
    let result = await queryOne<{ id: string }>(
      'DELETE FROM content_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (result) return res.json({ message: 'Content deleted' });

    // Try stories
    result = await queryOne<{ id: string }>(
      `DELETE FROM stories WHERE id = $1 AND child_profile_id IN
       (SELECT id FROM child_profiles WHERE user_id = $2) RETURNING id`,
      [id, userId]
    );
    if (result) return res.json({ message: 'Content deleted' });

    // Try voice clips
    result = await queryOne<{ id: string }>(
      'DELETE FROM voice_clips WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (result) return res.json({ message: 'Content deleted' });

    // Try journeys
    result = await queryOne<{ id: string }>(
      `DELETE FROM journeys WHERE id = $1 AND child_profile_id IN
       (SELECT id FROM child_profiles WHERE user_id = $2) RETURNING id`,
      [id, userId]
    );
    if (result) return res.json({ message: 'Content deleted' });

    throw new AppError(404, 'Content not found');
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/content-library/:id
 * Update content item (only works for content_items table)
 */
router.put(
  '/:id',
  validateBody(updateContentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { title, content, metadata, is_favorite } = req.body;

      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM content_items WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      if (!existing) {
        throw new AppError(404, 'Content not found');
      }

      const updates: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        params.push(title);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        params.push(content);
      }
      if (metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`);
        params.push(JSON.stringify(metadata));
      }
      if (is_favorite !== undefined) {
        updates.push(`is_favorite = $${paramIndex++}`);
        params.push(is_favorite);
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No updates provided');
      }

      params.push(id, userId);

      const item = await queryOne<ContentRow>(
        `UPDATE content_items
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING id, user_id, child_profile_id, content_type, title, content, metadata, is_favorite, created_at::text`,
        params
      );

      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
