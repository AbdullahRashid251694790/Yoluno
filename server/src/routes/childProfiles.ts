import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { z } from 'zod';
import type { ChildProfile } from '../types/index.js';

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
    const { name, age, avatar_id, interests, learning_style, pin_hash } = req.body;
    const id = uuidv4();

    const result = await queryOne<ChildProfile>(
      `INSERT INTO child_profiles (id, user_id, name, age, avatar_id, interests, learning_style, pin_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, req.user!.id, name, age, avatar_id, interests, learning_style, pin_hash]
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/child-profiles/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, age, avatar_id, interests, learning_style, pin_hash } = req.body;

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
           avatar_id = COALESCE($3, avatar_id),
           interests = COALESCE($4, interests),
           learning_style = COALESCE($5, learning_style),
           pin_hash = COALESCE($6, pin_hash),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, age, avatar_id, interests, learning_style, pin_hash, req.params.id]
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

export default router;
