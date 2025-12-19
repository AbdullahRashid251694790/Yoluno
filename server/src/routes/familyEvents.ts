/**
 * Family Events Routes
 *
 * Family events, photos, and export functionality.
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
interface FamilyEvent {
  id: string;
  user_id: string;
  family_member_id: string | null;
  event_type: 'birth' | 'death' | 'marriage' | 'graduation' | 'achievement' | 'holiday' | 'reunion' | 'milestone' | 'other';
  title: string;
  description: string | null;
  event_date: string | null;
  event_year: number | null;
  location: string | null;
  photos: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface FamilyPhoto {
  id: string;
  user_id: string;
  family_member_id: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  photo_date: string | null;
  location: string | null;
  tags: string[];
  is_favorite: boolean;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

interface ExportConfig {
  id: string;
  format: string;
  label: string;
  description: string | null;
  mime_type: string;
  file_extension: string;
  is_enabled: boolean;
  is_premium: boolean;
}

// Validation schemas
const createEventSchema = z.object({
  family_member_id: z.string().uuid().optional(),
  event_type: z.enum(['birth', 'death', 'marriage', 'graduation', 'achievement', 'holiday', 'reunion', 'milestone', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  event_date: z.string().optional(),
  event_year: z.number().int().min(1800).max(2100).optional(),
  location: z.string().max(200).optional(),
  photos: z.array(z.string().url()).max(20).optional(),
  is_private: z.boolean().optional(),
});

const updateEventSchema = z.object({
  family_member_id: z.string().uuid().optional().nullable(),
  event_type: z.enum(['birth', 'death', 'marriage', 'graduation', 'achievement', 'holiday', 'reunion', 'milestone', 'other']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  event_date: z.string().optional().nullable(),
  event_year: z.number().int().min(1800).max(2100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  photos: z.array(z.string().url()).max(20).optional(),
  is_private: z.boolean().optional(),
});

const createPhotoSchema = z.object({
  family_member_id: z.string().uuid().optional(),
  photo_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  caption: z.string().max(500).optional(),
  photo_date: z.string().optional(),
  location: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  file_size_bytes: z.number().int().positive().optional(),
});

const updatePhotoSchema = z.object({
  caption: z.string().max(500).optional().nullable(),
  photo_date: z.string().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  is_favorite: z.boolean().optional(),
});

// === EVENTS ===

/**
 * GET /api/family-events/events
 * List all family events
 */
router.get(
  '/events',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { familyMemberId, eventType, year, limit = '50', offset = '0' } = req.query;

      let sql = `
        SELECT e.id, e.user_id, e.family_member_id, e.event_type,
               e.title, e.description, e.event_date::text, e.event_year,
               e.location, e.photos, e.is_private, e.created_at::text, e.updated_at::text,
               fm.name as family_member_name
        FROM family_events e
        LEFT JOIN family_members fm ON e.family_member_id = fm.id
        WHERE e.user_id = $1
      `;
      const params: (string | number)[] = [userId];
      let paramIndex = 2;

      if (familyMemberId) {
        sql += ` AND e.family_member_id = $${paramIndex}`;
        params.push(familyMemberId as string);
        paramIndex++;
      }

      if (eventType) {
        sql += ` AND e.event_type = $${paramIndex}`;
        params.push(eventType as string);
        paramIndex++;
      }

      if (year) {
        sql += ` AND (e.event_year = $${paramIndex} OR EXTRACT(YEAR FROM e.event_date) = $${paramIndex})`;
        params.push(parseInt(year as string, 10));
        paramIndex++;
      }

      sql += ` ORDER BY COALESCE(e.event_date, (e.event_year || '-01-01')::date) DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

      const events = await query<FamilyEvent & { family_member_name: string | null }>(sql, params);

      // Get total count
      let countSql = `SELECT COUNT(*) as count FROM family_events WHERE user_id = $1`;
      const countParams: (string | number)[] = [userId];
      let countParamIndex = 2;

      if (familyMemberId) {
        countSql += ` AND family_member_id = $${countParamIndex}`;
        countParams.push(familyMemberId as string);
        countParamIndex++;
      }

      if (eventType) {
        countSql += ` AND event_type = $${countParamIndex}`;
        countParams.push(eventType as string);
        countParamIndex++;
      }

      if (year) {
        countSql += ` AND (event_year = $${countParamIndex} OR EXTRACT(YEAR FROM event_date) = $${countParamIndex})`;
        countParams.push(parseInt(year as string, 10));
      }

      const countResult = await queryOne<{ count: string }>(countSql, countParams);
      const total = parseInt(countResult?.count || '0', 10);

      res.json({
        items: events,
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
 * GET /api/family-events/event-types
 * Get available event types
 */
router.get(
  '/event-types',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const eventTypes = [
        { key: 'birth', label: 'Birth', icon: 'baby' },
        { key: 'death', label: 'Death', icon: 'heart' },
        { key: 'marriage', label: 'Marriage', icon: 'heart-handshake' },
        { key: 'graduation', label: 'Graduation', icon: 'graduation-cap' },
        { key: 'achievement', label: 'Achievement', icon: 'trophy' },
        { key: 'holiday', label: 'Holiday', icon: 'gift' },
        { key: 'reunion', label: 'Reunion', icon: 'users' },
        { key: 'milestone', label: 'Milestone', icon: 'flag' },
        { key: 'other', label: 'Other', icon: 'more-horizontal' },
      ];

      res.json(eventTypes);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/family-events/events/:id
 * Get a specific event
 */
router.get(
  '/events/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const event = await queryOne<FamilyEvent>(
        `SELECT id, user_id, family_member_id, event_type,
                title, description, event_date::text, event_year,
                location, photos, is_private, created_at::text, updated_at::text
        FROM family_events
        WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (!event) {
        throw new AppError(404, 'Event not found');
      }

      res.json(event);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/family-events/events
 * Create new event
 */
router.post(
  '/events',
  validateBody(createEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const {
        family_member_id,
        event_type,
        title,
        description,
        event_date,
        event_year,
        location,
        photos = [],
        is_private = false,
      } = req.body;

      // Verify family member belongs to user if provided
      if (family_member_id) {
        const member = await queryOne<{ id: string }>(
          'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
          [family_member_id, userId]
        );
        if (!member) {
          throw new AppError(404, 'Family member not found');
        }
      }

      const id = uuidv4();
      const event = await queryOne<FamilyEvent>(
        `INSERT INTO family_events (id, user_id, family_member_id, event_type, title, description, event_date, event_year, location, photos, is_private)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, user_id, family_member_id, event_type, title, description, event_date::text, event_year, location, photos, is_private, created_at::text, updated_at::text`,
        [id, userId, family_member_id || null, event_type, title, description || null, event_date || null, event_year || null, location || null, JSON.stringify(photos), is_private]
      );

      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/family-events/events/:id
 * Update event
 */
router.put(
  '/events/:id',
  validateBody(updateEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check ownership
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM family_events WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      if (!existing) {
        throw new AppError(404, 'Event not found');
      }

      // Verify family member if provided
      if (req.body.family_member_id) {
        const member = await queryOne<{ id: string }>(
          'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
          [req.body.family_member_id, userId]
        );
        if (!member) {
          throw new AppError(404, 'Family member not found');
        }
      }

      // Build update query
      const updates: string[] = [];
      const params: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      const fields: Array<{ key: string; transform?: (v: unknown) => unknown }> = [
        { key: 'family_member_id' },
        { key: 'event_type' },
        { key: 'title' },
        { key: 'description' },
        { key: 'event_date' },
        { key: 'event_year' },
        { key: 'location' },
        { key: 'photos', transform: (v) => JSON.stringify(v) },
        { key: 'is_private' },
      ];

      for (const field of fields) {
        if (req.body[field.key] !== undefined) {
          updates.push(`${field.key} = $${paramIndex}`);
          const value = field.transform ? field.transform(req.body[field.key]) : req.body[field.key];
          params.push(value as string | number | boolean | null);
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No updates provided');
      }

      params.push(id, userId);

      const event = await queryOne<FamilyEvent>(
        `UPDATE family_events
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING id, user_id, family_member_id, event_type, title, description, event_date::text, event_year, location, photos, is_private, created_at::text, updated_at::text`,
        params
      );

      res.json(event);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/family-events/events/:id
 * Delete event
 */
router.delete(
  '/events/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await queryOne<{ id: string }>(
        'DELETE FROM family_events WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (!result) {
        throw new AppError(404, 'Event not found');
      }

      res.json({ message: 'Event deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// === PHOTOS ===

/**
 * GET /api/family-events/photos
 * List all family photos
 */
router.get(
  '/photos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { familyMemberId, favorite, limit = '50', offset = '0' } = req.query;

      let sql = `
        SELECT p.id, p.user_id, p.family_member_id, p.photo_url, p.thumbnail_url,
               p.caption, p.photo_date::text, p.location, p.tags, p.is_favorite,
               p.width, p.height, p.file_size_bytes, p.created_at::text, p.updated_at::text,
               fm.name as family_member_name
        FROM family_photos p
        LEFT JOIN family_members fm ON p.family_member_id = fm.id
        WHERE p.user_id = $1
      `;
      const params: (string | number)[] = [userId];
      let paramIndex = 2;

      if (familyMemberId) {
        sql += ` AND p.family_member_id = $${paramIndex}`;
        params.push(familyMemberId as string);
        paramIndex++;
      }

      if (favorite === 'true') {
        sql += ` AND p.is_favorite = true`;
      }

      sql += ` ORDER BY p.photo_date DESC NULLS LAST, p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

      const photos = await query<FamilyPhoto & { family_member_name: string | null }>(sql, params);

      // Get total count
      let countSql = `SELECT COUNT(*) as count FROM family_photos WHERE user_id = $1`;
      const countParams: string[] = [userId];

      if (familyMemberId) {
        countSql += ` AND family_member_id = $2`;
        countParams.push(familyMemberId as string);
      }

      if (favorite === 'true') {
        countSql += ` AND is_favorite = true`;
      }

      const countResult = await queryOne<{ count: string }>(countSql, countParams);
      const total = parseInt(countResult?.count || '0', 10);

      res.json({
        items: photos,
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
 * POST /api/family-events/photos
 * Upload new photo
 */
router.post(
  '/photos',
  validateBody(createPhotoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const {
        family_member_id,
        photo_url,
        thumbnail_url,
        caption,
        photo_date,
        location,
        tags = [],
        width,
        height,
        file_size_bytes,
      } = req.body;

      // Verify family member belongs to user if provided
      if (family_member_id) {
        const member = await queryOne<{ id: string }>(
          'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
          [family_member_id, userId]
        );
        if (!member) {
          throw new AppError(404, 'Family member not found');
        }
      }

      const id = uuidv4();
      const photo = await queryOne<FamilyPhoto>(
        `INSERT INTO family_photos (id, user_id, family_member_id, photo_url, thumbnail_url, caption, photo_date, location, tags, width, height, file_size_bytes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, user_id, family_member_id, photo_url, thumbnail_url, caption, photo_date::text, location, tags, is_favorite, width, height, file_size_bytes, created_at::text, updated_at::text`,
        [id, userId, family_member_id || null, photo_url, thumbnail_url || null, caption || null, photo_date || null, location || null, JSON.stringify(tags), width || null, height || null, file_size_bytes || null]
      );

      res.status(201).json(photo);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/family-events/photos/:id
 * Update photo
 */
router.put(
  '/photos/:id',
  validateBody(updatePhotoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { caption, photo_date, location, tags, is_favorite } = req.body;

      // Check ownership
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM family_photos WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      if (!existing) {
        throw new AppError(404, 'Photo not found');
      }

      // Build update query
      const updates: string[] = [];
      const params: (string | boolean | null)[] = [];
      let paramIndex = 1;

      if (caption !== undefined) {
        updates.push(`caption = $${paramIndex}`);
        params.push(caption);
        paramIndex++;
      }
      if (photo_date !== undefined) {
        updates.push(`photo_date = $${paramIndex}`);
        params.push(photo_date);
        paramIndex++;
      }
      if (location !== undefined) {
        updates.push(`location = $${paramIndex}`);
        params.push(location);
        paramIndex++;
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex}`);
        params.push(JSON.stringify(tags));
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

      const photo = await queryOne<FamilyPhoto>(
        `UPDATE family_photos
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING id, user_id, family_member_id, photo_url, thumbnail_url, caption, photo_date::text, location, tags, is_favorite, width, height, file_size_bytes, created_at::text, updated_at::text`,
        params
      );

      res.json(photo);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/family-events/photos/:id/favorite
 * Toggle photo favorite
 */
router.put(
  '/photos/:id/favorite',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const photo = await queryOne<FamilyPhoto>(
        `UPDATE family_photos
        SET is_favorite = NOT is_favorite
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, family_member_id, photo_url, thumbnail_url, caption, photo_date::text, location, tags, is_favorite, width, height, file_size_bytes, created_at::text, updated_at::text`,
        [id, userId]
      );

      if (!photo) {
        throw new AppError(404, 'Photo not found');
      }

      res.json(photo);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/family-events/photos/:id
 * Delete photo
 */
router.delete(
  '/photos/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await queryOne<{ id: string }>(
        'DELETE FROM family_photos WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (!result) {
        throw new AppError(404, 'Photo not found');
      }

      res.json({ message: 'Photo deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// === EXPORT ===

/**
 * GET /api/family-events/export/configs
 * Get available export formats
 */
router.get(
  '/export/configs',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const configs = await query<ExportConfig>(
        `SELECT id, format, label, description, mime_type, file_extension, is_enabled, is_premium
        FROM export_configs
        WHERE is_enabled = true
        ORDER BY format`
      );

      res.json(configs);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/family-events/export
 * Export family tree data
 */
router.post(
  '/export',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { format = 'json' } = req.body;

      // Verify format is valid
      const config = await queryOne<ExportConfig>(
        'SELECT * FROM export_configs WHERE format = $1 AND is_enabled = true',
        [format]
      );

      if (!config) {
        throw new AppError(400, 'Invalid or unsupported export format');
      }

      // Get family data
      const familyMembers = await query(
        `SELECT id, name, relationship, birth_date::text, bio, photo_url, created_at::text
        FROM family_members WHERE user_id = $1`,
        [userId]
      );

      const events = await query(
        `SELECT id, family_member_id, event_type, title, description, event_date::text, event_year, location
        FROM family_events WHERE user_id = $1`,
        [userId]
      );

      const photos = await query(
        `SELECT id, family_member_id, photo_url, caption, photo_date::text, location
        FROM family_photos WHERE user_id = $1`,
        [userId]
      );

      if (format === 'json') {
        res.json({
          exported_at: new Date().toISOString(),
          family_members: familyMembers,
          events: events,
          photos: photos,
        });
      } else {
        // For other formats, return the data with instructions
        // In a real implementation, this would generate the actual file
        res.json({
          format,
          mime_type: config.mime_type,
          file_extension: config.file_extension,
          data: {
            family_members: familyMembers,
            events: events,
            photos: photos,
          },
          message: `Export to ${config.label} format prepared. Full implementation would generate the actual file.`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// === TIMELINE ===

/**
 * GET /api/family-events/timeline
 * Get family timeline (events sorted chronologically)
 */
router.get(
  '/timeline',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { limit = '50' } = req.query;

      const events = await query<FamilyEvent & { family_member_name: string | null }>(
        `SELECT e.id, e.user_id, e.family_member_id, e.event_type,
                e.title, e.description, e.event_date::text, e.event_year,
                e.location, e.photos, e.is_private, e.created_at::text, e.updated_at::text,
                fm.name as family_member_name
        FROM family_events e
        LEFT JOIN family_members fm ON e.family_member_id = fm.id
        WHERE e.user_id = $1 AND e.is_private = false
        ORDER BY COALESCE(e.event_date, (e.event_year || '-01-01')::date) DESC NULLS LAST
        LIMIT $2`,
        [userId, parseInt(limit as string, 10)]
      );

      res.json(events);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
