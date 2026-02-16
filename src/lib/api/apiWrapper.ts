/**
 * Generic API Wrapper
 *
 * DRY utility for API calls with consistent error handling.
 * Eliminates repetitive try-catch blocks across services.
 */

import { apiClient } from '@/integrations/api';
import { handleError, type ErrorStrategy } from '@/lib/errors';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

interface ApiRequestOptions<T> {
  /** URL parameters for GET requests */
  params?: Record<string, unknown>;
  /** Request body for POST/PUT requests */
  data?: unknown;
  /** Default value to return if data is null/undefined */
  defaultValue?: T;
  /** Error handling strategy */
  strategy?: ErrorStrategy;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Generic API request handler with error normalization
 */
export async function apiRequest<T>(
  method: HttpMethod,
  endpoint: string,
  context: string,
  options: ApiRequestOptions<T> = {}
): Promise<T> {
  const { params, data, defaultValue, strategy = 'throw', headers } = options;

  try {
    let response;

    switch (method) {
      case 'get':
        response = await apiClient.get<T>(endpoint, { params, headers });
        break;
      case 'post':
        response = await apiClient.post<T>(endpoint, data, { headers });
        break;
      case 'put':
        response = await apiClient.put<T>(endpoint, data, { headers });
        break;
      case 'delete':
        response = await apiClient.delete<T>(endpoint, { headers });
        break;
    }

    return response.data ?? (defaultValue as T);
  } catch (error) {
    throw handleError(error, { context, strategy });
  }
}

/**
 * GET request with optional default value
 */
export async function apiGet<T>(
  endpoint: string,
  context: string,
  options: Omit<ApiRequestOptions<T>, 'data'> = {}
): Promise<T> {
  return apiRequest<T>('get', endpoint, context, options);
}

/**
 * GET request that returns null on 404
 */
export async function apiGetOrNull<T>(
  endpoint: string,
  context: string,
  options: Omit<ApiRequestOptions<T>, 'data' | 'defaultValue'> = {}
): Promise<T | null> {
  try {
    return await apiRequest<T>('get', endpoint, context, { ...options, strategy: 'throw' });
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw handleError(error, { context, strategy: options.strategy ?? 'throw' });
  }
}

/**
 * POST request
 */
export async function apiPost<T>(
  endpoint: string,
  context: string,
  data?: unknown,
  options: Omit<ApiRequestOptions<T>, 'data' | 'params'> = {}
): Promise<T> {
  return apiRequest<T>('post', endpoint, context, { ...options, data });
}

/**
 * PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  context: string,
  data?: unknown,
  options: Omit<ApiRequestOptions<T>, 'data' | 'params'> = {}
): Promise<T> {
  return apiRequest<T>('put', endpoint, context, { ...options, data });
}

/**
 * DELETE request
 */
export async function apiDelete(
  endpoint: string,
  context: string,
  options: Omit<ApiRequestOptions<void>, 'data' | 'params' | 'defaultValue'> = {}
): Promise<void> {
  return apiRequest<void>('delete', endpoint, context, options);
}

/**
 * POST request with FormData (for file uploads)
 */
export async function apiPostFormData<T>(
  endpoint: string,
  context: string,
  formData: FormData,
  options: Omit<ApiRequestOptions<T>, 'data' | 'params'> = {}
): Promise<T> {
  return apiRequest<T>('post', endpoint, context, {
    ...options,
    data: formData,
  });
}
