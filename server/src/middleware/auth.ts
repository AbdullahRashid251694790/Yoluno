import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AppError } from './errorHandler.js';

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: Express.User | false) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new AppError(401, 'Unauthorized'));
    }
    req.user = user;
    next();
  })(req, res, next);
}

// Middleware to optionally authenticate (attach user if token valid, continue if not)
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: Express.User | false) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
}
