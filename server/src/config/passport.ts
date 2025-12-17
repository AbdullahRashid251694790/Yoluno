import { PassportStatic } from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { queryOne } from './database.js';

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

interface User {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: Date;
}

export function configurePassport(passport: PassportStatic): void {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'default-secret-change-me',
    algorithms: ['HS256'],
  };

  passport.use(
    new JwtStrategy(options, async (payload: JwtPayload, done) => {
      try {
        // Only accept access tokens
        if (payload.type !== 'access') {
          return done(null, false, { message: 'Invalid token type' });
        }

        const user = await queryOne<User>(
          'SELECT id, email, email_verified, created_at FROM users WHERE id = $1',
          [payload.sub]
        );

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      email_verified: boolean;
      created_at: Date;
    }
  }
}
