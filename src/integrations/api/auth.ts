import { apiClient, setTokens, clearTokens, getAccessToken, refreshAccessToken } from './client';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface SessionResponse {
  user: User;
}

// Register a new user (no tokens returned — email verification required first)
export async function register(email: string, password: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/register', {
    email,
    password,
  });

  return response.data;
}

// Login with email and password
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  const { accessToken } = response.data;
  setTokens(accessToken);

  return response.data;
}

// Logout
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    clearTokens();
  }
}

// Get current session (tries to refresh token first if none in memory)
export async function getSession(): Promise<SessionResponse | null> {
  try {
    // If no access token in memory (e.g., page reload), try refreshing via cookie first
    if (!getAccessToken()) {
      try {
        await refreshAccessToken();
      } catch {
        // Retry once after a short delay (handles transient network issues on page load)
        await new Promise((r) => setTimeout(r, 1000));
        try {
          await refreshAccessToken();
        } catch {
          // Refresh failed twice → user is truly logged out
          return null;
        }
      }
    }

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

// Verify email with token
export async function verifyEmail(token: string): Promise<{ message: string }> {
  const response = await apiClient.get<{ message: string }>('/auth/verify-email', {
    params: { token },
  });
  return response.data;
}

// Resend verification email
export async function resendVerification(email: string): Promise<void> {
  await apiClient.post('/auth/resend-verification', { email });
}
