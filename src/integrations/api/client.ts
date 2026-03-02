import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout to prevent infinite hangs
});

// In-memory access token (not in localStorage for security)
let accessToken: string | null = null;

// Token management functions
export function getAccessToken(): string | null {
  return accessToken;
}

export function setTokens(newAccessToken: string): void {
  accessToken = newAccessToken;
}

export function clearTokens(): void {
  accessToken = null;
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let refreshSubscribers: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (err: unknown) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((s) => s.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((s) => s.reject(err));
  refreshSubscribers = [];
}

/**
 * Attempt to refresh the access token using the httpOnly refresh cookie.
 * Returns the new access token, or throws if refresh fails.
 * Deduplicates concurrent calls — only one refresh request is in-flight at a time.
 */
export async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
        withCredentials: true,
      });
      const { accessToken: newAccessToken } = response.data;
      setTokens(newAccessToken);
      onTokenRefreshed(newAccessToken);
      return newAccessToken;
    } catch (err) {
      onRefreshFailed(err);
      clearTokens();
      throw err;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request interceptor - add auth token and handle FormData Content-Type
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh for refresh/login/register endpoints (prevents infinite loop)
    const url = originalRequest.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')) {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject
        );
      });
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

// API response types
export interface ApiError {
  error: string;
  message?: string;
}

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error);
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.error || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Get the full URL for an uploaded file.
 * Handles three formats:
 *   - Full URL (http/https) → returned as-is (e.g., S3 signed URLs)
 *   - Absolute path (/uploads/...) → prepends backend base URL
 *   - Bare storage key (child-avatars/...) → prepends /uploads/ and backend base URL
 */
export function getUploadUrl(relativePath: string | null | undefined): string | undefined {
  if (!relativePath) return undefined;

  // If already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Get the base URL (API_URL without /api suffix)
  const baseUrl = API_URL.replace(/\/api\/?$/, '');

  // If it's already an absolute path (starts with /), use as-is
  // Otherwise it's a bare storage key — prepend /uploads/
  const path = relativePath.startsWith('/')
    ? relativePath
    : `/uploads/${relativePath}`;

  return `${baseUrl}${path}`;
}
