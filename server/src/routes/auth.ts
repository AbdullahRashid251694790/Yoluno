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
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateBody,
} from '../utils/validation.js';
import type { User, Session } from '../types/index.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js';

const router = Router();

// Helper to set refresh token cookie
function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/auth',
  });
}

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

    // Generate email verification token
    const verificationToken = uuidv4();

    await query(
      `INSERT INTO users (id, email, password_hash, email_verified, email_verification_token, email_verification_expires)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
      [userId, email.toLowerCase(), passwordHash, false, verificationToken]
    );

    // Create default subscription
    await query(
      `INSERT INTO user_subscriptions (id, user_id, tier, stories_limit, chat_messages_limit)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), userId, 'free', 10, 100]
    );

    // Send verification email (non-blocking)
    sendVerificationEmail(email.toLowerCase(), verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
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

    // Block unverified users
    if (!user.email_verified) {
      res.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before signing in. Check your inbox for the verification link.',
      });
      return;
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

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

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

    clearRefreshTokenCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Read from cookie first, fallback to body for backward compat
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;
    if (!refreshToken) {
      throw new AppError(401, 'No refresh token provided');
    }

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

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
      },
      accessToken: newAccessToken,
    });
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

    // Send password reset email (non-blocking)
    sendPasswordResetEmail(email.toLowerCase(), resetToken).catch((err) => {
      console.error('Failed to send password reset email:', err);
    });

    res.json({ message: 'If the email exists, a reset link will be sent' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/verify-email
router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Verification token is required');
    }

    const user = await queryOne<User>(
      `SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()`,
      [token]
    );

    if (!user) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    await query(
      `UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1`,
      [user.id]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      throw new AppError(400, 'Email is required');
    }

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (!user || user.email_verified) {
      res.json({ message: 'If the email exists and is unverified, a verification link will be sent.' });
      return;
    }

    const verificationToken = uuidv4();
    await query(
      `UPDATE users SET email_verification_token = $1, email_verification_expires = NOW() + INTERVAL '24 hours' WHERE id = $2`,
      [verificationToken, user.id]
    );

    sendVerificationEmail(user.email, verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    res.json({ message: 'If the email exists and is unverified, a verification link will be sent.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = validateBody(resetPasswordSchema, req.body);

    // Find user with valid reset token
    const users = await query<User>(
      `SELECT * FROM users WHERE password_reset_expires > NOW() AND password_reset_token IS NOT NULL`,
      []
    );

    let matchedUser: User | null = null;
    for (const user of users.rows) {
      const matches = await verifyPassword(token, user.password_reset_token!);
      if (matches) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    // Update password and clear reset token
    const newPasswordHash = await hashPassword(password);
    await query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2`,
      [newPasswordHash, matchedUser.id]
    );

    // Invalidate all sessions
    await query('DELETE FROM sessions WHERE user_id = $1', [matchedUser.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/account
router.delete('/account', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;

    if (!password) {
      throw new AppError(400, 'Password is required to delete account');
    }

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      throw new AppError(401, 'Incorrect password');
    }

    // Delete user (cascades to all related data)
    await query('DELETE FROM users WHERE id = $1', [user.id]);

    clearRefreshTokenCookie(res);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
