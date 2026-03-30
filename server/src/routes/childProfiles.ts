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
import { getFileUrl } from '../utils/storage.js';

/** Auto-assign featured journey templates to a new child */
async function assignDefaultJourneys(childId: string, childAge: number): Promise<void> {
  try {
    const templates = await query<{ id: string; title: string; badge_emoji: string | null }>(
      `SELECT id, title, badge_emoji FROM journey_templates
       WHERE is_auto_assign = true AND age_range_min <= $1 AND age_range_max >= $1`,
      [childAge]
    );

    for (const template of templates.rows) {
      // Check if already assigned
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM journeys WHERE child_profile_id = $1 AND template_id = $2',
        [childId, template.id]
      );
      if (existing) continue;

      const journeyId = uuidv4();
      await query(
        `INSERT INTO journeys (id, child_profile_id, template_id, title, status, progress, badge_emoji)
         VALUES ($1, $2, $3, $4, 'active', 0, $5)`,
        [journeyId, childId, template.id, template.title, template.badge_emoji || '🏅']
      );

      // Copy template steps
      const steps = await query<{ step_order: number; title: string; description: string | null; type: string | null; content: Record<string, unknown> }>(
        'SELECT step_order, title, description, type, content FROM journey_template_steps WHERE template_id = $1 ORDER BY step_order',
        [template.id]
      );

      for (const step of steps.rows) {
        await query(
          `INSERT INTO journey_steps (id, journey_id, step_order, title, description, type, content, progress)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 0)`,
          [uuidv4(), journeyId, step.step_order, step.title, step.description, step.type, step.content]
        );
      }
    }
  } catch (error) {
    console.error('Failed to assign default journeys:', (error as Error).message);
  }
}

// PIN validation schemas
const setPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

const verifyPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

const SALT_ROUNDS = 10;

const router = Router();

// Resolve avatar to a usable URL (custom upload or library avatar)
async function resolveAvatarUrl(profile: ChildProfile): Promise<ChildProfile & { avatarUrl?: string }> {
  if (profile.custom_avatar_url) {
    const avatarUrl = await getFileUrl(profile.custom_avatar_url);
    return { ...profile, avatarUrl };
  }
  if (profile.avatar_id) {
    const avatar = await queryOne<{ image_url: string }>(
      'SELECT image_url FROM avatar_library WHERE id = $1',
      [profile.avatar_id]
    );
    if (avatar) {
      return { ...profile, avatarUrl: avatar.image_url };
    }
  }
  return profile;
}

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
    const profiles = await Promise.all(result.rows.map(resolveAvatarUrl));
    res.json(profiles);
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

    res.json(await resolveAvatarUrl(profile));
  } catch (error) {
    next(error);
  }
});

// POST /api/child-profiles
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Enforce max 5 children per account
    const childCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM child_profiles WHERE user_id = $1',
      [req.user!.id]
    );
    if (childCount && parseInt(childCount.count, 10) >= 5) {
      throw new AppError(400, 'Maximum of 5 children allowed per account.');
    }

    const { name, age, gender, avatar_id, custom_avatar_url, interests, learning_style, pin_hash } = req.body;
    const id = uuidv4();

    const result = await queryOne<ChildProfile>(
      `INSERT INTO child_profiles (id, user_id, name, age, gender, avatar_id, custom_avatar_url, interests, learning_style, pin_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, req.user!.id, name, age, gender, avatar_id, custom_avatar_url, interests, learning_style, pin_hash]
    );

    // Auto-assign featured journeys to the new child
    assignDefaultJourneys(id, age).catch((err) => {
      console.error('Default journey assignment failed:', err.message);
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/child-profiles/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, age, gender, avatar_id, custom_avatar_url, interests, learning_style, pin_hash } = req.body;

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
           avatar_id = COALESCE($4, avatar_id),
           custom_avatar_url = COALESCE($5, custom_avatar_url),
           interests = COALESCE($6, interests),
           learning_style = COALESCE($7, learning_style),
           pin_hash = COALESCE($8, pin_hash),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, age, gender, avatar_id, custom_avatar_url, interests, learning_style, pin_hash, req.params.id]
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
