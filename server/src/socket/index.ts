import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { queryOne } from '../config/database.js';

interface SocketData {
  userId: string;
  email: string;
}

export function setupSocketHandlers(io: Server): void {
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as {
        sub: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'access') {
        return next(new Error('Invalid token type'));
      }

      (socket.data as SocketData).userId = decoded.sub;
      (socket.data as SocketData).email = decoded.email;
      next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as SocketData).userId;
    console.log(`User connected: ${userId}`);

    // Join user's private room for safety alerts
    socket.join(`user:${userId}`);

    // Join child-specific rooms for buddy messages
    socket.on('join-child-room', async (childId: string) => {
      try {
        // Verify the user owns this child profile
        const child = await queryOne(
          'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
          [childId, userId]
        );

        if (child) {
          socket.join(`child:${childId}`);
          console.log(`User ${userId} joined child room: ${childId}`);
        } else {
          socket.emit('error', { message: 'Access denied to child profile' });
        }
      } catch (error) {
        console.error('Error joining child room:', error);
        socket.emit('error', { message: 'Failed to join child room' });
      }
    });

    socket.on('leave-child-room', (childId: string) => {
      socket.leave(`child:${childId}`);
      console.log(`User ${userId} left child room: ${childId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
}

// Helper to emit events from route handlers
export function emitToUser(io: Server, userId: string, event: string, data: unknown): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToChild(io: Server, childId: string, event: string, data: unknown): void {
  io.to(`child:${childId}`).emit(event, data);
}
