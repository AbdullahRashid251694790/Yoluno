// API Client exports
export {
  apiClient,
  getAccessToken,
  setTokens,
  clearTokens,
  isAuthenticated,
  isApiError,
  getErrorMessage,
  getUploadUrl,
  refreshAccessToken,
} from './client';

// Auth exports
export {
  register,
  login,
  logout,
  getSession,
  updatePassword,
  forgotPassword,
  resetPassword,
} from './auth';
export type { User, AuthResponse, SessionResponse } from './auth';

// Socket exports
export {
  initSocket,
  getSocket,
  disconnectSocket,
  reconnectSocket,
  joinChildRoom,
  leaveChildRoom,
  onNewMessage,
  onSafetyAlert,
  onSocketEvent,
  emitSocketEvent,
} from './socket';
