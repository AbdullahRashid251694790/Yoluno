import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Child profile schemas
export const createChildProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  age: z.number().int().min(1).max(18),
  avatar_id: z.string().uuid().optional(),
  interests: z.array(z.string()).optional(),
  learning_style: z.string().optional(),
  pin_hash: z.string().optional(),
});

export const updateChildProfileSchema = createChildProfileSchema.partial();

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Validate request body - supports two usage patterns:
 * 1. Direct call: validateBody(schema, data) - returns validated data
 * 2. Middleware factory: validateBody(schema) - returns Express middleware
 */
export function validateBody<T>(schema: z.ZodType<T>, data: unknown): T;
export function validateBody<T>(schema: z.ZodType<T>): (req: Request, res: Response, next: NextFunction) => void;
export function validateBody<T>(schema: z.ZodType<T>, data?: unknown): T | ((req: Request, res: Response, next: NextFunction) => void) {
  // If data is provided, validate directly
  if (data !== undefined) {
    return schema.parse(data);
  }

  // Otherwise, return middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
}
