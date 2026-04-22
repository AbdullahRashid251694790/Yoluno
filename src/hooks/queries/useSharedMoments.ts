/**
 * Shared Moments Query Hooks
 *
 * React Query hooks for the parent-facing "Shared with you" feed and the
 * kid-facing "Share with parent" action.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  sharedMomentsService,
  type SharedMoment,
} from '@/services/sharedMoments';
import { handleError } from '@/lib/errors';

const QUERY_KEY = ['shared-moments'] as const;

export function useSharedMoments() {
  return useQuery<SharedMoment[]>({
    queryKey: QUERY_KEY,
    queryFn: sharedMomentsService.listSharedMoments,
    staleTime: 30 * 1000,
  });
}

export function useChildSharedMoments(childId: string | undefined) {
  return useQuery<SharedMoment[]>({
    queryKey: [...QUERY_KEY, 'child', childId ?? ''],
    queryFn: () => sharedMomentsService.listChildSharedMoments(childId!),
    enabled: !!childId,
    staleTime: 30 * 1000,
  });
}

export function useMarkSharedMomentSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharedMomentsService.markSharedMomentSeen(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<SharedMoment[]>(QUERY_KEY);
      queryClient.setQueryData<SharedMoment[]>(
        QUERY_KEY,
        (old) => (old || []).filter((m) => m.id !== id)
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
      handleError(error, {
        context: 'useMarkSharedMomentSeen',
        userMessage: 'Could not mark as seen.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export type { SharedMoment };
