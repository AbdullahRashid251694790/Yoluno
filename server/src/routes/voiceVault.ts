/**
 * Voice Vault Routes
 *
 * Voice clip storage and management for family recordings.
 * All data from database - no hardcoding.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { resolveAudioUrl } from '../utils/storage.js';
import { z } from 'zod';

// Resolve the stored audio_url into a fresh playable URL on every read.
// Storing raw S3 keys means signed URLs never expire mid-session.
async function withResolvedUrl<T extends { audio_url: string | null }>(clip: T): Promise<T> {
  return { ...clip, audio_url: (await resolveAudioUrl(clip.audio_url)) ?? clip.audio_url };
}

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Types
interface VoiceClip {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  family_member_id: string | null;
  title: string;
  description: string | null;
  category: 'encouragement' | 'praise' | 'celebration' | 'story' | 'memory' | 'greeting' | 'other';
  audio_url: string;
  duration_seconds: number;
  file_size_bytes: number | null;
  transcription: string | null;
  is_favorite: boolean;
  play_count: number;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
}

interface VoiceClipTag {
  id: string;
  voice_clip_id: string;
  tag: string;
}

// Validation schemas
const createVoiceClipSchema = z.object({
  child_profile_id: z.string().uuid().optional(),
  family_member_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  category: z.enum(['encouragement', 'praise', 'celebration', 'story', 'memory', 'greeting', 'other']),
  audio_url: z.string().min(1),
  duration_seconds: z.number().int().positive(),
  file_size_bytes: z.number().int().positive().optional(),
  transcription: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const updateVoiceClipSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(['encouragement', 'praise', 'celebration', 'story', 'memory', 'greeting', 'message', 'other']).optional(),
  transcription: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  family_member_id: z.string().uuid().nullable().optional(),
});

/**
 * GET /api/voice-vault
 * List all voice clips for the user
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { childId, familyMemberId, category, favorite, limit = '50', offset = '0' } = req.query;

      let sql = `
        SELECT vc.id, vc.user_id, vc.child_profile_id, vc.family_member_id,
               vc.title, vc.description, vc.category, vc.audio_url,
               vc.duration_seconds, vc.file_size_bytes, vc.transcription,
               vc.is_favorite, vc.play_count, vc.last_played_at::text,
               vc.created_at::text, vc.updated_at::text,
               cp.name as child_name,
               fm.name as family_member_name
        FROM voice_clips vc
        LEFT JOIN child_profiles cp ON vc.child_profile_id = cp.id
        LEFT JOIN family_members fm ON vc.family_member_id = fm.id
        WHERE vc.user_id = $1
      `;
      const params: (string | boolean | number)[] = [userId];
      let paramIndex = 2;

      if (childId) {
        sql += ` AND vc.child_profile_id = $${paramIndex}`;
        params.push(childId as string);
        paramIndex++;
      }

      if (familyMemberId) {
        sql += ` AND vc.family_member_id = $${paramIndex}`;
        params.push(familyMemberId as string);
        paramIndex++;
      }

      if (category) {
        sql += ` AND vc.category = $${paramIndex}`;
        params.push(category as string);
        paramIndex++;
      }

      if (favorite === 'true') {
        sql += ` AND vc.is_favorite = true`;
      }

      sql += ` ORDER BY vc.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

      const itemsResult = await query<VoiceClip & { child_name: string | null; family_member_name: string | null }>(sql, params);
      const items = itemsResult.rows;

      // Get tags for each clip
      const clipIds = items.map(i => i.id);
      let tags: VoiceClipTag[] = [];
      if (clipIds.length > 0) {
        const tagsResult = await query<VoiceClipTag>(
          `SELECT id, voice_clip_id, tag FROM voice_clip_tags WHERE voice_clip_id = ANY($1)`,
          [clipIds]
        );
        tags = tagsResult.rows;
      }

      const tagsByClip = tags.reduce((acc, t) => {
        if (!acc[t.voice_clip_id]) acc[t.voice_clip_id] = [];
        acc[t.voice_clip_id].push(t.tag);
        return acc;
      }, {} as Record<string, string[]>);

      const itemsWithTags = await Promise.all(
        items.map(async (item) => ({
          ...(await withResolvedUrl(item)),
          tags: tagsByClip[item.id] || [],
        }))
      );

      // Get total count
      let countSql = `SELECT COUNT(*) as count FROM voice_clips WHERE user_id = $1`;
      const countParams: string[] = [userId];
      let countParamIndex = 2;

      if (childId) {
        countSql += ` AND child_profile_id = $${countParamIndex}`;
        countParams.push(childId as string);
        countParamIndex++;
      }

      if (familyMemberId) {
        countSql += ` AND family_member_id = $${countParamIndex}`;
        countParams.push(familyMemberId as string);
        countParamIndex++;
      }

      if (category) {
        countSql += ` AND category = $${countParamIndex}`;
        countParams.push(category as string);
      }

      if (favorite === 'true') {
        countSql += ` AND is_favorite = true`;
      }

      const countResult = await queryOne<{ count: string }>(countSql, countParams);
      const total = parseInt(countResult?.count || '0', 10);

      res.json({
        items: itemsWithTags,
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
 * GET /api/voice-vault/categories
 * Get available categories from database
 */
router.get(
  '/categories',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Categories are defined in the database check constraint
      const categories = [
        { key: 'encouragement', label: 'Encouragement', icon: 'heart' },
        { key: 'praise', label: 'Praise', icon: 'star' },
        { key: 'celebration', label: 'Celebration', icon: 'party-popper' },
        { key: 'story', label: 'Story', icon: 'book-open' },
        { key: 'memory', label: 'Memory', icon: 'camera' },
        { key: 'greeting', label: 'Greeting', icon: 'hand-wave' },
        { key: 'other', label: 'Other', icon: 'more-horizontal' },
      ];

      res.json(categories);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/voice-vault/:id
 * Get a specific voice clip
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const item = await queryOne<VoiceClip>(
        `SELECT id, user_id, child_profile_id, family_member_id,
                title, description, category, audio_url,
                duration_seconds, file_size_bytes, transcription,
                is_favorite, play_count, last_played_at::text,
                created_at::text, updated_at::text
        FROM voice_clips
        WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (!item) {
        throw new AppError(404, 'Voice clip not found');
      }

      // Get tags
      const tagsResult = await query<{ tag: string }>(
        'SELECT tag FROM voice_clip_tags WHERE voice_clip_id = $1',
        [id]
      );

      res.json({
        ...(await withResolvedUrl(item)),
        tags: tagsResult.rows.map(t => t.tag),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/voice-vault
 * Create new voice clip
 */
router.post(
  '/',
  validateBody(createVoiceClipSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const {
        child_profile_id,
        family_member_id,
        title,
        description,
        category,
        audio_url,
        duration_seconds,
        file_size_bytes,
        transcription,
        tags = [],
      } = req.body;

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
      const item = await queryOne<VoiceClip>(
        `INSERT INTO voice_clips (id, user_id, child_profile_id, family_member_id, title, description, category, audio_url, duration_seconds, file_size_bytes, transcription)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, user_id, child_profile_id, family_member_id, title, description, category, audio_url, duration_seconds, file_size_bytes, transcription, is_favorite, play_count, last_played_at::text, created_at::text, updated_at::text`,
        [id, userId, child_profile_id || null, family_member_id || null, title, description || null, category, audio_url, duration_seconds, file_size_bytes || null, transcription || null]
      );

      // Add tags
      if (tags.length > 0) {
        for (const tag of tags) {
          await query(
            'INSERT INTO voice_clip_tags (id, voice_clip_id, tag) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [uuidv4(), id, tag]
          );
        }
      }

      res.status(201).json({
        ...(item ? await withResolvedUrl(item) : item),
        tags,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/voice-vault/:id
 * Update voice clip
 */
router.put(
  '/:id',
  validateBody(updateVoiceClipSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { title, description, category, transcription, tags, family_member_id } = req.body;

      // Check ownership
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM voice_clips WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      if (!existing) {
        throw new AppError(404, 'Voice clip not found');
      }

      // Build update query
      const updates: string[] = [];
      const params: (string | null)[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        params.push(title);
        paramIndex++;
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }
      if (transcription !== undefined) {
        updates.push(`transcription = $${paramIndex}`);
        params.push(transcription);
        paramIndex++;
      }
      if (family_member_id !== undefined) {
        // If a family member id is provided, verify it belongs to the user
        if (family_member_id) {
          const member = await queryOne<{ id: string }>(
            'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
            [family_member_id, userId]
          );
          if (!member) {
            throw new AppError(404, 'Family member not found');
          }
        }
        updates.push(`family_member_id = $${paramIndex}`);
        params.push(family_member_id);
        paramIndex++;
      }

      let item: VoiceClip | null = null;
      if (updates.length > 0) {
        params.push(id, userId);
        item = await queryOne<VoiceClip>(
          `UPDATE voice_clips
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
          RETURNING id, user_id, child_profile_id, family_member_id, title, description, category, audio_url, duration_seconds, file_size_bytes, transcription, is_favorite, play_count, last_played_at::text, created_at::text, updated_at::text`,
          params
        );
      } else {
        item = await queryOne<VoiceClip>(
          `SELECT id, user_id, child_profile_id, family_member_id, title, description, category, audio_url, duration_seconds, file_size_bytes, transcription, is_favorite, play_count, last_played_at::text, created_at::text, updated_at::text
          FROM voice_clips WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );
      }

      // Update tags if provided
      if (tags !== undefined) {
        await query('DELETE FROM voice_clip_tags WHERE voice_clip_id = $1', [id]);
        for (const tag of tags) {
          await query(
            'INSERT INTO voice_clip_tags (id, voice_clip_id, tag) VALUES ($1, $2, $3)',
            [uuidv4(), id, tag]
          );
        }
      }

      // Get current tags
      const currentTagsResult = await query<{ tag: string }>(
        'SELECT tag FROM voice_clip_tags WHERE voice_clip_id = $1',
        [id]
      );

      res.json({
        ...(item ? await withResolvedUrl(item) : item),
        tags: currentTagsResult.rows.map(t => t.tag),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/voice-vault/:id/favorite
 * Toggle favorite status
 */
router.put(
  '/:id/favorite',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const item = await queryOne<VoiceClip>(
        `UPDATE voice_clips
        SET is_favorite = NOT is_favorite
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, child_profile_id, family_member_id, title, description, category, audio_url, duration_seconds, file_size_bytes, transcription, is_favorite, play_count, last_played_at::text, created_at::text, updated_at::text`,
        [id, userId]
      );

      if (!item) {
        throw new AppError(404, 'Voice clip not found');
      }

      res.json(await withResolvedUrl(item));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/voice-vault/:id/play
 * Increment play count
 */
router.post(
  '/:id/play',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify ownership
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM voice_clips WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      if (!existing) {
        throw new AppError(404, 'Voice clip not found');
      }

      // Increment play count using database function
      await query('SELECT increment_voice_clip_play_count($1)', [id]);

      res.json({ message: 'Play count incremented' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/voice-vault/:id
 * Delete voice clip
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await queryOne<{ id: string }>(
        'DELETE FROM voice_clips WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (!result) {
        throw new AppError(404, 'Voice clip not found');
      }

      res.json({ message: 'Voice clip deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Recording Invites ──────────────────────────────────────────────────────

// POST /api/voice-vault/invites — create a public recording invite link
router.post('/invites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const invite = await queryOne<{ id: string; expires_at: string }>(
      `INSERT INTO voice_recording_invites (user_id) VALUES ($1)
       RETURNING id, expires_at::text`,
      [userId]
    );
    res.status(201).json(invite);
  } catch (error) {
    next(error);
  }
});

// GET /api/voice-vault/invites — list active invites for the user
router.get('/invites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await query<{ id: string; created_at: string; expires_at: string; is_active: boolean }>(
      `SELECT id, created_at::text, expires_at::text, is_active
       FROM voice_recording_invites
       WHERE user_id = $1 AND is_active = true AND expires_at > now()
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/voice-vault/invites/:id — revoke an invite
router.delete('/invites/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await query(
      'UPDATE voice_recording_invites SET is_active = false WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    res.json({ message: 'Invite revoked' });
  } catch (error) {
    next(error);
  }
});

export default router;
