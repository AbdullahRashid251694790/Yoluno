import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // Don't try to refresh for auth endpoints (prevents infinite loop)
    const url = originalRequest.url || '';
    if (url.includes('/auth/')) {
      return Promise.reject(error);
    }

    // Don't try to refresh if user was never authenticated
    if (!accessToken) {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh token is sent automatically via httpOnly cookie
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
        withCredentials: true,
      });

      const { accessToken: newAccessToken } = response.data;
      setTokens(newAccessToken);

      isRefreshing = false;
      onTokenRefreshed(newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      clearTokens();
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
 * Converts relative URLs like /uploads/... to full URLs pointing to the backend.
 */
export function getUploadUrl(relativePath: string | null | undefined): string | undefined {
  if (!relativePath) return undefined;

  // If already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Get the base URL (API_URL without /api suffix)
  const baseUrl = API_URL.replace(/\/api\/?$/, '');

  // Ensure path starts with /
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  return `${baseUrl}${path}`;
}
