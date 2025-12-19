/**
 * Journeys Query Hooks
 *
 * React Query hooks for learning journey operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { journeysService } from '@/services/journeys';
import type { JourneyInsert, JourneyUpdate } from '@/types/database';
import { handleError } from '@/lib/errors';

/**
 * Get all journeys, optionally filtered by child
 */
export function useJourneys(childId?: string) {
  return useQuery({
    queryKey: childId
      ? queryKeys.journeys.forChild(childId)
      : queryKeys.journeys.lists(),
    queryFn: () => journeysService.getAll(childId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useActiveJourneys(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeys.active(childId ?? ''),
    queryFn: () => journeysService.getActive(childId!),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCompletedJourneys(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeys.completed(childId ?? ''),
    queryFn: () => journeysService.getCompleted(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJourney(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeys.detail(id ?? ''),
    queryFn: () => journeysService.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useJourneyProgress(journeyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeys.progress(journeyId ?? ''),
    queryFn: () => journeysService.getProgress(journeyId!),
    enabled: !!journeyId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journey: JourneyInsert) => journeysService.create(journey),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.active(data.child_profile_id),
      });
      return data;
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateJourney',
        userMessage: 'Failed to start journey',
      });
    },
  });
}

export function useUpdateJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: JourneyUpdate }) =>
      journeysService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.active(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.completed(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.detail(data.id),
      });
      return data;
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateJourney',
        userMessage: 'Failed to update journey',
      });
    },
  });
}

export function useCompleteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, journeyId }: { stepId: string; journeyId: string }) =>
      journeysService.completeStep(stepId, journeyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.detail(data.journey_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.progress(data.journey_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.lists(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCompleteStep',
        userMessage: 'Failed to complete step',
      });
    },
  });
}

export function useUpdateStepProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, journeyId, progress }: { stepId: string; journeyId: string; progress: number }) =>
      journeysService.updateStepProgress(stepId, journeyId, progress),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.detail(data.journey_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeys.progress(data.journey_id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateStepProgress',
        userMessage: 'Failed to update progress',
      });
    },
  });
}
