import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

// Initialize socket connection
export function initSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = getAccessToken();

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
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

// React hook to use socket instance
import { useState, useEffect } from 'react';

export function useSocket(): Socket | null {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(socket);

  useEffect(() => {
    // Initialize socket if not already connected
    if (!socket?.connected) {
      const newSocket = initSocket();
      setSocketInstance(newSocket);
    }

    // Update state when socket changes
    const checkConnection = setInterval(() => {
      if (socket !== socketInstance) {
        setSocketInstance(socket);
      }
    }, 1000);

    return () => {
      clearInterval(checkConnection);
    };
  }, [socketInstance]);

  return socketInstance;
}
