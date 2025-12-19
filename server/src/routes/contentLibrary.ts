/**
 * Content Library Routes
 *
 * Saved content management for parents.
 * All data from database - no hardcoding.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Types
interface ContentItem {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  content_type: 'story' | 'chat_snippet' | 'journey' | 'note';
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  is_favorite: boolean;
  created_at: string;
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

/**
 * GET /api/content-library
 * List all saved content for the user
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { childId, type, favorite, limit = '50', offset = '0' } = req.query;

      let sql = `
        SELECT c.id, c.user_id, c.child_profile_id, c.content_type,
               c.title, c.content, c.metadata, c.is_favorite, c.created_at::text,
               cp.name as child_name
        FROM content_items c
        LEFT JOIN child_profiles cp ON c.child_profile_id = cp.id
        WHERE c.user_id = $1
      `;
      const params: (string | boolean | number)[] = [userId];
      let paramIndex = 2;

      if (childId) {
        sql += ` AND c.child_profile_id = $${paramIndex}`;
        params.push(childId as string);
        paramIndex++;
      }

      if (type) {
        sql += ` AND c.content_type = $${paramIndex}`;
        params.push(type as string);
        paramIndex++;
      }

      if (favorite === 'true') {
        sql += ` AND c.is_favorite = true`;
      }

      sql += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

      const items = await query<ContentItem & { child_name: string | null }>(sql, params);

      // Get total count for pagination
      let countSql = `SELECT COUNT(*) as count FROM content_items WHERE user_id = $1`;
      const countParams: (string | boolean)[] = [userId];
      let countParamIndex = 2;

      if (childId) {
        countSql += ` AND child_profile_id = $${countParamIndex}`;
        countParams.push(childId as string);
        countParamIndex++;
      }

      if (type) {
        countSql += ` AND content_type = $${countParamIndex}`;
        countParams.push(type as string);
      }

      if (favorite === 'true') {
        countSql += ` AND is_favorite = true`;
      }

      const countResult = await queryOne<{ count: string }>(countSql, countParams);
      const total = parseInt(countResult?.count || '0', 10);

      res.json({
        items,
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/content-library/:id
 * Get a specific content item
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const item = await queryOne<ContentItem>(
        `SELECT id, user_id, child_profile_id, content_type,
                title, content, metadata, is_favorite, created_at::text
        FROM content_items
        WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (!item) {
        throw new AppError(404, 'Content not found');
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/content-library
 * Save new content
 */
router.post(
  '/',
  validateBody(createContentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { child_profile_id, content_type, title, content, metadata = {} } = req.body;

      // Verify child belongs to user if provided
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
      const item = await queryOne<ContentItem>(
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
 * PUT /api/content-library/:id
 * Update content item
 */
router.put(
  '/:id',
  validateBody(updateContentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { title, content, metadata, is_favorite } = req.body;

      // Check ownership
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM content_items WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      if (!existing) {
        throw new AppError(404, 'Content not found');
      }

      // Build update query
      const updates: string[] = [];
      const params: (string | boolean | object)[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        params.push(title);
        paramIndex++;
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex}`);
        params.push(content);
        paramIndex++;
      }
      if (metadata !== undefined) {
        updates.push(`metadata = $${paramIndex}`);
        params.push(JSON.stringify(metadata));
        paramIndex++;
      }
      if (is_favorite !== undefined) {
        updates.push(`is_favorite = $${paramIndex}`);
        params.push(is_favorite);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No updates provided');
      }

      params.push(id, userId);

      const item = await queryOne<ContentItem>(
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

/**
 * PUT /api/content-library/:id/favorite
 * Toggle favorite status
 */
router.put(
  '/:id/favorite',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const item = await queryOne<ContentItem>(
        `UPDATE content_items
        SET is_favorite = NOT is_favorite
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, child_profile_id, content_type, title, content, metadata, is_favorite, created_at::text`,
        [id, userId]
      );

      if (!item) {
        throw new AppError(404, 'Content not found');
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/content-library/:id
 * Delete content item
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await queryOne<{ id: string }>(
        'DELETE FROM content_items WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (!result) {
        throw new AppError(404, 'Content not found');
      }

      res.json({ message: 'Content deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
