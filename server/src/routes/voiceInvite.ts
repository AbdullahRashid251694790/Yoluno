/**
 * Public Voice Recording Invite Routes
 *
 * Endpoints accessible without authentication — used by invited
 * family members (grandparents, uncles, etc.) to record voice
 * messages for a child without needing a Yoluno account.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { query, queryOne } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadFile, getFileUrl } from '../utils/storage.js';
import path from 'path';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const ALLOWED_CATEGORIES = [
  'encouragement',
  'praise',
  'celebration',
  'story',
  'memory',
  'greeting',
  'message',
  'other',
];

interface Invite {
  id: string;
  user_id: string;
  expires_at: string;
  is_active: boolean;
}

interface InviteWithUser extends Invite {
  parent_email: string | null;
}

// GET /api/invite/:token — verify an invite is valid, return parent name + family members
router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await queryOne<InviteWithUser>(
      `SELECT vri.*, u.email as parent_email
       FROM voice_recording_invites vri
       JOIN users u ON vri.user_id = u.id
       WHERE vri.id = $1`,
      [req.params.token]
    );

    if (!invite) {
      throw new AppError(404, 'Invite not found');
    }
    if (!invite.is_active) {
      throw new AppError(410, 'This invite has been revoked');
    }
    if (new Date(invite.expires_at) < new Date()) {
      throw new AppError(410, 'This invite has expired');
    }

    // Return family members so the recorder can pick who they are
    const familyMembersResult = await query<{
      id: string;
      name: string;
      relationship: string;
      photo_url: string | null;
    }>(
      `SELECT id, name, relationship, photo_url
       FROM family_members
       WHERE user_id = $1
       ORDER BY name ASC`,
      [invite.user_id]
    );

    // Return just enough info — no PII beyond the parent's first name
    const parentName = invite.parent_email?.split('@')[0] || 'A Yoluno family';
    res.json({
      valid: true,
      parent_name: parentName,
      family_members: familyMembersResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/invite/:token/record — submit a voice recording
router.post('/:token/record', upload.single('audio'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await queryOne<Invite>(
      'SELECT * FROM voice_recording_invites WHERE id = $1',
      [req.params.token]
    );

    if (!invite) {
      throw new AppError(404, 'Invite not found');
    }
    if (!invite.is_active) {
      throw new AppError(410, 'This invite has been revoked');
    }
    if (new Date(invite.expires_at) < new Date()) {
      throw new AppError(410, 'This invite has expired');
    }

    if (!req.file) {
      throw new AppError(400, 'No audio file provided');
    }

    const {
      title,
      category = 'other',
      description,
      duration_seconds,
      recorded_by,
      family_member_id,
    } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError(400, 'Title is required');
    }
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new AppError(400, `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
    }

    // If a family_member_id was provided, verify it belongs to the same parent
    let resolvedFamilyMemberId: string | null = null;
    if (family_member_id && typeof family_member_id === 'string') {
      const member = await queryOne<{ id: string }>(
        'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
        [family_member_id, invite.user_id]
      );
      if (!member) {
        throw new AppError(400, 'Selected family member does not exist');
      }
      resolvedFamilyMemberId = family_member_id;
    }

    // Upload audio to storage
    const ext = path.extname(req.file.originalname) || '.webm';
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    const key = `voice-clips/${invite.user_id}/${filename}`;
    await uploadFile(key, req.file.buffer, req.file.mimetype);

    // Resolve the key into a playable URL — on S3 this returns a signed URL,
    // on local storage this returns /uploads/<key>. Mirrors what the dashboard
    // upload route does so playback works consistently across environments.
    const audioUrl = await getFileUrl(key, 86400);

    // Create voice clip owned by the parent
    const clipId = uuidv4();
    await queryOne(
      `INSERT INTO voice_clips (id, user_id, family_member_id, title, description, category, audio_url, duration_seconds, file_size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        clipId,
        invite.user_id,
        resolvedFamilyMemberId,
        title.trim(),
        description || (recorded_by ? `Recorded by ${recorded_by}` : null),
        category,
        audioUrl,
        parseInt(duration_seconds, 10) || 0,
        req.file.size,
      ]
    );

    res.status(201).json({ success: true, message: 'Thank you — your recording has been saved.' });
  } catch (error) {
    next(error);
  }
});

export default router;
