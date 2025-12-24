// API Client exports
export {
  apiClient,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isApiError,
  getErrorMessage,
  getUploadUrl,
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
  isAuthenticated,
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
