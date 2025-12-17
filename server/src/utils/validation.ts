import { z } from 'zod';

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

// Helper to validate request body
export function validateBody<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
