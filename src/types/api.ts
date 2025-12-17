/**
 * API Types
 *
 * Types for API responses, async states, and data fetching patterns.
 * Uses SafetyLevel from domain.ts as single source of truth.
 */

import type { SafetyLevel } from './domain';

/**
 * Discriminated union for async operation states.
 * Use this for managing loading, error, and success states.
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

/**
 * Type guard for checking if async state is loading
 */
export function isLoading<T>(state: AsyncState<T>): state is { status: 'loading' } {
  return state.status === 'loading';
}

/**
 * Type guard for checking if async state has data
 */
export function hasData<T>(state: AsyncState<T>): state is { status: 'success'; data: T } {
  return state.status === 'success';
}

/**
 * Type guard for checking if async state has error
 */
export function hasError<T>(state: AsyncState<T>): state is { status: 'error'; error: Error } {
  return state.status === 'error';
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Query options for list endpoints
 */
export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

/**
 * Mutation result type
 */
export interface MutationResult<T> {
  data: T | null;
  error: ApiError | null;
  isSuccess: boolean;
}

/**
 * Edge function response types
 */
export interface ChatResponse {
  message: string;
  safetyLevel: SafetyLevel;
  suggestions?: string[];
  memoryUpdates?: {
    type: string;
    key: string;
    value: string;
  }[];
}

export interface StoryGenerationResponse {
  title: string;
  content: string;
  scenes: {
    sceneNumber: number;
    description: string;
  }[];
  wordCount: number;
}

export interface IllustrationResponse {
  illustrations: {
    sceneNumber: number;
    imageUrl?: string;
    error?: string;
  }[];
}

export interface NarrationResponse {
  audioContent: string;
  duration: number;
  format: string;
}

export interface ValidationResponse {
  level: SafetyLevel;
  reason?: string;
  suggestions?: string[];
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}

/**
 * Usage quota info
 */
export interface UsageQuota {
  used: number;
  limit: number;
  period: 'daily' | 'weekly' | 'monthly';
  resetAt: Date;
}
