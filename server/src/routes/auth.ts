import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  validateBody,
} from '../utils/validation.js';
import type { User, Session, AuthResponse } from '../types/index.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = validateBody(registerSchema, req.body);

    // Check if user already exists
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    await query(
      `INSERT INTO users (id, email, password_hash, email_verified)
       VALUES ($1, $2, $3, $4)`,
      [userId, email.toLowerCase(), passwordHash, false]
    );

    // Create default subscription
    await query(
      `INSERT INTO user_subscriptions (id, user_id, tier, stories_limit, chat_messages_limit)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), userId, 'free', 10, 100]
    );

    // Generate tokens
    const accessToken = generateAccessToken(userId, email);
    const refreshToken = generateRefreshToken(userId, email);

    // Store refresh token
    const refreshTokenHash = await hashPassword(refreshToken);
    await query(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [uuidv4(), userId, refreshTokenHash]
    );

    const response: AuthResponse = {
      user: {
        id: userId,
        email: email.toLowerCase(),
        email_verified: false,
      },
      accessToken,
      refreshToken,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = validateBody(loginSchema, req.body);

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token
    const refreshTokenHash = await hashPassword(refreshToken);
    await query(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [uuidv4(), user.id, refreshTokenHash]
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
      },
      accessToken,
      refreshToken,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete specific session
      const sessions = await query<Session>(
        'SELECT * FROM sessions WHERE user_id = $1',
        [req.user!.id]
      );

      for (const session of sessions.rows) {
        const matches = await verifyPassword(refreshToken, session.refresh_token_hash);
        if (matches) {
          await query('DELETE FROM sessions WHERE id = $1', [session.id]);
          break;
        }
      }
    } else {
      // Delete all sessions for this user
      await query('DELETE FROM sessions WHERE user_id = $1', [req.user!.id]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = validateBody(refreshTokenSchema, req.body);

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'Invalid token type');
    }

    // Find valid session
    const sessions = await query<Session>(
      'SELECT * FROM sessions WHERE user_id = $1 AND expires_at > NOW()',
      [decoded.sub]
    );

    let validSession: Session | null = null;
    for (const session of sessions.rows) {
      const matches = await verifyPassword(refreshToken, session.refresh_token_hash);
      if (matches) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Get user
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (!user) {
      throw new AppError(401, 'User not found');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    // Update session with new refresh token
    const newRefreshTokenHash = await hashPassword(newRefreshToken);
    await query(
      `UPDATE sessions SET refresh_token_hash = $1, expires_at = NOW() + INTERVAL '7 days'
       WHERE id = $2`,
      [newRefreshTokenHash, validSession.id]
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/session
router.get('/session', requireAuth, async (req: Request, res: Response) => {
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      email_verified: req.user!.email_verified,
    },
  });
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = validateBody(updatePasswordSchema, req.body);

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const validPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!validPassword) {
      throw new AppError(401, 'Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user!.id]
    );

    // Invalidate all refresh tokens
    await query('DELETE FROM sessions WHERE user_id = $1', [req.user!.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = validateBody(forgotPasswordSchema, req.body);

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If the email exists, a reset link will be sent' });
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenHash = await hashPassword(resetToken);

    await query(
      `UPDATE users SET
        password_reset_token = $1,
        password_reset_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $2`,
      [resetTokenHash, user.id]
    );

    // TODO: Send email with reset link
    // For now, just log it (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    res.json({ message: 'If the email exists, a reset link will be sent' });
  } catch (error) {
    next(error);
  }
});

export default router;
