/**
 * Content Library Query Hooks
 *
 * React Query hooks for saved content management.
 * All data from database - no hardcoding.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  contentLibraryService,
  type ContentItem,
  type ContentType,
  type ContentListResponse,
  type ContentFilters,
  type CreateContentInput,
  type UpdateContentInput,
} from '@/services/contentLibrary';
import { handleError } from '@/lib/errors';

/**
 * Get saved content list
 */
export function useContentItems(filters: ContentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.contentLibrary.list(filters),
    queryFn: () => contentLibraryService.getItems(filters),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get a single content item
 */
export function useContentItem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contentLibrary.detail(id ?? ''),
    queryFn: () => contentLibraryService.getItem(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create new content
 */
export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContentInput) => contentLibraryService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentLibrary.lists(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateContent',
        userMessage: 'Failed to save content',
      });
    },
  });
}

/**
 * Update content item
 */
export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContentInput }) =>
      contentLibraryService.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentLibrary.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentLibrary.detail(data.id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateContent',
        userMessage: 'Failed to update content',
      });
    },
  });
}

/**
 * Toggle favorite status
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentLibraryService.toggleFavorite(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentLibrary.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentLibrary.detail(data.id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useToggleFavorite',
        userMessage: 'Failed to update favorite',
      });
    },
  });
}

/**
 * Delete content item
 */
export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentLibraryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentLibrary.lists(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteContent',
        userMessage: 'Failed to delete content',
      });
    },
  });
}

// Re-export types
export type {
  ContentItem,
  ContentType,
  ContentListResponse,
  ContentFilters,
  CreateContentInput,
  UpdateContentInput,
};
