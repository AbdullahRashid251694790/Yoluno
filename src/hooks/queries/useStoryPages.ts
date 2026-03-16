/**
 * Story Pages Query Hooks
 *
 * React Query hooks for story pages (storybook experience).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { storyPagesService, type StoryPage, type IllustrationStatusResponse } from '@/services/storyPages';

// Query hooks
export function useStoryPages(storyId: string | undefined, options?: { illustrationsInProgress?: boolean }) {
  const illustrationsInProgress = options?.illustrationsInProgress ?? false;

  return useQuery({
    queryKey: queryKeys.storyPages.forStory(storyId ?? ''),
    queryFn: () => storyPagesService.getPages(storyId!),
    enabled: !!storyId,
    staleTime: illustrationsInProgress ? 2000 : 30 * 1000,
    refetchInterval: illustrationsInProgress ? 4000 : false,
  });
}

export function useIllustrationStatus(
  storyId: string | undefined,
  options?: { pollingInterval?: number; enabled?: boolean }
) {
  const { pollingInterval = 3000, enabled = true } = options ?? {};

  return useQuery({
    queryKey: queryKeys.storyPages.illustrationStatus(storyId ?? ''),
    queryFn: () => storyPagesService.getIllustrationStatus(storyId!),
    enabled: !!storyId && enabled,
    refetchInterval: (query) => {
      // Stop polling when all illustrations are done
      const data = query.state.data as IllustrationStatusResponse | undefined;
      if (data && data.completed + data.failed >= data.total_pages) {
        return false;
      }
      return pollingInterval;
    },
    staleTime: 1000, // Very short stale time for status updates
  });
}

// Mutation hooks
export function useRegenerateIllustrations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => storyPagesService.regenerateIllustrations(storyId),
    onSuccess: (_, storyId) => {
      // Invalidate the illustration status to trigger re-polling
      queryClient.invalidateQueries({
        queryKey: queryKeys.storyPages.illustrationStatus(storyId),
      });
      // Also invalidate pages to get fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.storyPages.forStory(storyId),
      });
    },
  });
}

export function useGeneratePageAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storyId,
      pageNumber,
      voice,
    }: {
      storyId: string;
      pageNumber: number;
      voice?: string;
    }) => storyPagesService.generatePageAudio(storyId, pageNumber, voice),
    onSuccess: (_, { storyId }) => {
      // Invalidate pages to get the updated audio URL
      queryClient.invalidateQueries({
        queryKey: queryKeys.storyPages.forStory(storyId),
      });
    },
  });
}

export type { StoryPage, IllustrationStatusResponse };
