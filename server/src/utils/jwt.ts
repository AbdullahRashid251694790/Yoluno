import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
// Convert time strings to seconds
const ACCESS_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REFRESH_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email, type: 'access' } as TokenPayload,
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY_SECONDS }
  );
}

export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email, type: 'refresh' } as TokenPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY_SECONDS }
  );
}

export function verifyToken(token: string): DecodedToken {
  return jwt.verify(token, JWT_SECRET) as DecodedToken;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}
