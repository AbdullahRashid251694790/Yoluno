/**
 * Onboarding Query Hooks
 *
 * React Query hooks for child onboarding.
 * All data from database - no hardcoding.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  onboardingService,
  type OnboardingProgress,
  type OnboardingStatus,
  type UpdateStepInput,
} from '@/services/onboarding';
import { handleError } from '@/lib/errors';

/**
 * Get onboarding progress for a child
 */
export function useOnboardingProgress(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.onboarding.progress(childId ?? ''),
    queryFn: () => onboardingService.getProgress(childId!),
    enabled: !!childId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Get onboarding status (quick check)
 */
export function useOnboardingStatus(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.onboarding.status(childId ?? ''),
    queryFn: () => onboardingService.getStatus(childId!),
    enabled: !!childId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Update onboarding step
 */
export function useUpdateOnboardingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, input }: { childId: string; input: UpdateStepInput }) =>
      onboardingService.updateStep(childId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.progress(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.status(data.child_profile_id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateOnboardingStep',
        userMessage: 'Failed to update onboarding',
      });
    },
  });
}

/**
 * Complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, skipped = false }: { childId: string; skipped?: boolean }) =>
      onboardingService.complete(childId, skipped),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.progress(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.status(data.child_profile_id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCompleteOnboarding',
        userMessage: 'Failed to complete onboarding',
      });
    },
  });
}

/**
 * Reset onboarding
 */
export function useResetOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) => onboardingService.reset(childId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.progress(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.status(data.child_profile_id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useResetOnboarding',
        userMessage: 'Failed to reset onboarding',
      });
    },
  });
}

// Re-export types
export type {
  OnboardingProgress,
  OnboardingStatus,
  UpdateStepInput,
};
