import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

// Initialize socket connection
export function initSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    // Use a function so socket.io fetches the LATEST token on every reconnect
    auth: (cb) => {
      cb({ token: getAccessToken() });
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    // If auth error, the socket.io auth function will fetch the latest token on next reconnect attempt
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}

// Get current socket instance
export function getSocket(): Socket | null {
  return socket;
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Reconnect with new token (after login/refresh)
export function reconnectSocket(): Socket {
  disconnectSocket();
  return initSocket();
}

// Join a child's chat room
export function joinChildRoom(childId: string): void {
  if (socket?.connected) {
    socket.emit('join-child-room', childId);
  }
}

// Leave a child's chat room
export function leaveChildRoom(childId: string): void {
  if (socket?.connected) {
    socket.emit('leave-child-room', childId);
  }
}

// Subscribe to new messages for a child
export function onNewMessage(callback: (message: unknown) => void): () => void {
  if (!socket) return () => {};

  socket.on('new-message', callback);
  return () => socket?.off('new-message', callback);
}

// Subscribe to safety alerts
export function onSafetyAlert(callback: (report: unknown) => void): () => void {
  if (!socket) return () => {};

  socket.on('safety-alert', callback);
  return () => socket?.off('safety-alert', callback);
}

// Subscribe to socket events
export function onSocketEvent(event: string, callback: (...args: unknown[]) => void): () => void {
  if (!socket) return () => {};

  socket.on(event, callback);
  return () => socket?.off(event, callback);
}

// Emit socket event
export function emitSocketEvent(event: string, ...args: unknown[]): void {
  if (socket?.connected) {
    socket.emit(event, ...args);
  }
}

// Subscribe to parent notifications
export function onParentNotification(callback: (notification: unknown) => void): () => void {
  if (!socket) return () => {};

  socket.on('parent-notification', callback);
  return () => socket?.off('parent-notification', callback);
}

// Subscribe to kid notifications (story complete, etc.)
export function onKidNotification(callback: (notification: unknown) => void): () => void {
  if (!socket) return () => {};

  socket.on('kid-notification', callback);
  return () => socket?.off('kid-notification', callback);
}

// Subscribe to child mood check-in events (real-time parent dashboard updates)
export function onMoodCheckin(
  callback: (data: { childId: string; childName: string; mood: string; checkin: unknown }) => void
): () => void {
  if (!socket) return () => {};

  socket.on('mood-checkin', callback);
  return () => socket?.off('mood-checkin', callback);
}

// React hook to use socket instance
import { useState, useEffect } from 'react';

export function useSocket(): Socket | null {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(socket);

  useEffect(() => {
    // Only initialize if we have a token and socket isn't already connected
    const token = getAccessToken();
    if (token && !socket?.connected) {
      const newSocket = initSocket();
      setSocketInstance(newSocket);
    }

    // No polling interval - just set once
    return () => {
      // Don't disconnect on unmount - keep socket alive
    };
  }, []);

  return socketInstance;
}
