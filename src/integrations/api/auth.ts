import { apiClient, setTokens, clearTokens, getRefreshToken } from './client';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SessionResponse {
  user: User;
}

// Register a new user
export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
  });

  const { accessToken, refreshToken } = response.data;
  setTokens(accessToken, refreshToken);

  return response.data;
}

// Login with email and password
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  const { accessToken, refreshToken } = response.data;
  setTokens(accessToken, refreshToken);

  return response.data;
}

// Logout
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    await apiClient.post('/auth/logout', { refreshToken });
  } finally {
    clearTokens();
  }
}

// Get current session
export async function getSession(): Promise<SessionResponse | null> {
  try {
    const response = await apiClient.get<SessionResponse>('/auth/session');
    return response.data;
  } catch {
    return null;
  }
}

// Update password
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.put('/auth/password', {
    currentPassword,
    newPassword,
  });
  // After password change, tokens are invalidated - user needs to re-login
  clearTokens();
}

// Request password reset
export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

// Reset password with token
export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password });
}

// Check if user is authenticated (has valid tokens)
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
