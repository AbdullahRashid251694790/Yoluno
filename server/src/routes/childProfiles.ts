import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { emitToUser } from '../socket/index.js';
import { z } from 'zod';
import type { ChildProfile, ParentNotification } from '../types/index.js';
import type { Server } from 'socket.io';

// PIN validation schemas
const setPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

const verifyPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

const SALT_ROUNDS = 10;

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/child-profiles
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<ChildProfile>(
      `SELECT * FROM child_profiles
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/child-profiles/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await queryOne<ChildProfile>(
      'SELECT * FROM child_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!profile) {
      throw new AppError(404, 'Child profile not found');
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// POST /api/child-profiles
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, age, gender, birthday, avatar_id, custom_avatar_url, interests, learning_style, pin_hash } = req.body;
    const id = uuidv4();

    const result = await queryOne<ChildProfile>(
      `INSERT INTO child_profiles (id, user_id, name, age, gender, birthday, avatar_id, custom_avatar_url, interests, learning_style, pin_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, req.user!.id, name, age, gender, birthday || null, avatar_id, custom_avatar_url, interests, learning_style, pin_hash]
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/child-profiles/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, age, gender, birthday, avatar_id, custom_avatar_url, interests, learning_style, pin_hash } = req.body;

    // Verify ownership
    const existing = await queryOne<ChildProfile>(
      'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!existing) {
      throw new AppError(404, 'Child profile not found');
    }

    const result = await queryOne<ChildProfile>(
      `UPDATE child_profiles
       SET name = COALESCE($1, name),
           age = COALESCE($2, age),
           gender = COALESCE($3, gender),
           birthday = COALESCE($4, birthday),
           avatar_id = COALESCE($5, avatar_id),
           custom_avatar_url = COALESCE($6, custom_avatar_url),
           interests = COALESCE($7, interests),
           learning_style = COALESCE($8, learning_style),
           pin_hash = COALESCE($9, pin_hash),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, age, gender, birthday, avatar_id, custom_avatar_url, interests, learning_style, pin_hash, req.params.id]
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/child-profiles/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'DELETE FROM child_profiles WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Child profile not found');
    }

    res.json({ message: 'Child profile deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/child-profiles/:id/activity
router.post('/:id/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE child_profiles
       SET last_active_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user!.id]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Child profile not found');
    }

    res.json({ message: 'Activity recorded' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PIN Authentication Routes
// ============================================================

// GET /api/child-profiles/:id/pin/status - Check if PIN is set
router.get('/:id/pin/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await queryOne<ChildProfile>(
      'SELECT id, pin_hash FROM child_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!profile) {
      throw new AppError(404, 'Child profile not found');
    }

    res.json({
      hasPin: !!profile.pin_hash,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/child-profiles/:id/pin - Set or update PIN
router.post('/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pin } = validateBody(setPinSchema, req.body);

    // Verify ownership
    const existing = await queryOne<ChildProfile>(
      'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!existing) {
      throw new AppError(404, 'Child profile not found');
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);

    await query(
      `UPDATE child_profiles
       SET pin_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [pinHash, req.params.id]
    );

    res.json({ message: 'PIN set successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/child-profiles/:id/pin/verify - Verify PIN
router.post('/:id/pin/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pin } = validateBody(verifyPinSchema, req.body);

    const profile = await queryOne<ChildProfile>(
      'SELECT id, pin_hash FROM child_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!profile) {
      throw new AppError(404, 'Child profile not found');
    }

    // No PIN set - this is an error, not a fallback
    if (!profile.pin_hash) {
      throw new AppError(400, 'No PIN is set for this profile');
    }

    // Verify the PIN
    const isValid = await bcrypt.compare(pin, profile.pin_hash);

    if (!isValid) {
      throw new AppError(401, 'Invalid PIN');
    }

    res.json({ verified: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/child-profiles/:id/pin - Remove PIN
router.delete('/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify ownership
    const existing = await queryOne<ChildProfile>(
      'SELECT id, pin_hash FROM child_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!existing) {
      throw new AppError(404, 'Child profile not found');
    }

    if (!existing.pin_hash) {
      throw new AppError(400, 'No PIN is set for this profile');
    }

    await query(
      `UPDATE child_profiles
       SET pin_hash = NULL, updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    res.json({ message: 'PIN removed successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Password Change Request (for kids to notify parents)
// ============================================================

// POST /api/child-profiles/:id/request-password-change
// Rate limited: 1 request per hour per child
router.post('/:id/request-password-change', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get child profile (verify it belongs to the authenticated user)
    const profile = await queryOne<ChildProfile>(
      'SELECT id, user_id, name FROM child_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!profile) {
      throw new AppError(404, 'Child profile not found');
    }

    // Check for rate limiting - max 1 request per hour per child
    const recentRequest = await queryOne<{ id: string }>(
      `SELECT id FROM parent_notifications
       WHERE child_profile_id = $1
       AND notification_type = 'password_change_request'
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [profile.id]
    );

    if (recentRequest) {
      throw new AppError(429, 'A password change request was already sent recently. Please wait before trying again.');
    }

    // Create notification for parent
    const notification = await queryOne<ParentNotification>(
      `INSERT INTO parent_notifications (user_id, child_profile_id, notification_type, title, message)
       VALUES ($1, $2, 'password_change_request', $3, $4)
       RETURNING *`,
      [
        profile.user_id,
        profile.id,
        'Password Change Requested',
        `${profile.name} has requested a password change. Please check your account settings.`
      ]
    );

    // Emit real-time notification via Socket.io
    const io = req.app.get('io') as Server | undefined;
    if (io && notification) {
      emitToUser(io, profile.user_id, 'parent-notification', {
        ...notification,
        child_name: profile.name
      });
    }

    res.json({ message: 'Password change request sent to parent' });
  } catch (error) {
    next(error);
  }
});

export default router;
