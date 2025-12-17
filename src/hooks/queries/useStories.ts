/**
 * Stories Query Hooks
 *
 * React Query hooks for story operations.
 * Refactored to use mutation factory for DRY compliance.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createMutationHook } from './useMutationFactory';
import { storiesService } from '@/services/stories';
import type { StoryInsert, StoryUpdate, StoryRow } from '@/types/database';

// Query hooks
export function useStoriesByChild(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.listByChild(childId ?? ''),
    queryFn: () => storiesService.getByChild(childId!),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStory(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.detail(id ?? ''),
    queryFn: () => storiesService.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFavoriteStories(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.favorites(childId ?? ''),
    queryFn: () => storiesService.getFavorites(childId!),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecentStories(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: queryKeys.stories.recent(userId ?? ''),
    queryFn: () => storiesService.getRecent(userId!, limit),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });
}

// Mutation hooks using factory
export const useCreateStory = createMutationHook<StoryRow, StoryInsert>({
  mutationFn: storiesService.create,
  context: 'useCreateStory',
  userMessage: 'Failed to create story',
  invalidateKeys: (data) => [
    queryKeys.stories.listByChild(data.child_profile_id),
    queryKeys.stories.recent(''),
  ],
});

export const useUpdateStory = createMutationHook<StoryRow, { id: string; updates: StoryUpdate }>({
  mutationFn: ({ id, updates }) => storiesService.update(id, updates),
  context: 'useUpdateStory',
  userMessage: 'Failed to update story',
  invalidateKeys: (data) => [
    queryKeys.stories.listByChild(data.child_profile_id),
    queryKeys.stories.detail(data.id),
  ],
});

export const useDeleteStory = createMutationHook<void, string>({
  mutationFn: storiesService.delete,
  context: 'useDeleteStory',
  userMessage: 'Failed to delete story',
  invalidateKeys: () => [queryKeys.stories.lists()],
  removeKeys: (_, id) => [queryKeys.stories.detail(id)],
});

export const useToggleFavorite = createMutationHook<
  StoryRow,
  { id: string; isFavorite: boolean }
>({
  mutationFn: ({ id, isFavorite }) => storiesService.toggleFavorite(id, isFavorite),
  context: 'useToggleFavorite',
  userMessage: 'Failed to update favorite status',
  invalidateKeys: (data) => [
    queryKeys.stories.listByChild(data.child_profile_id),
    queryKeys.stories.favorites(data.child_profile_id),
    queryKeys.stories.detail(data.id),
  ],
});
