/**
 * Kids Mode Query Hooks
 *
 * React Query hooks for kids mode configuration and settings.
 * All data from database - no hardcoding.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  kidsModeService,
  type KidsModeConfig,
  type PersonalityConfig,
  type StorySettings,
  type UpdateStorySettingsInput,
} from '@/services/kidsMode';
import { handleError } from '@/lib/errors';

/**
 * Get available kids mode configurations
 */
export function useKidsModeConfigs() {
  return useQuery({
    queryKey: queryKeys.kidsMode.configs(),
    queryFn: () => kidsModeService.getModeConfigs(),
    staleTime: 30 * 60 * 1000, // Mode configs rarely change
  });
}

/**
 * Get available personality configurations
 */
export function usePersonalityConfigs() {
  return useQuery({
    queryKey: queryKeys.kidsMode.personalities(),
    queryFn: () => kidsModeService.getPersonalityConfigs(),
    staleTime: 30 * 60 * 1000, // Personality configs rarely change
  });
}

/**
 * Get a specific personality configuration
 */
export function usePersonality(key: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kidsMode.personality(key ?? ''),
    queryFn: () => kidsModeService.getPersonality(key!),
    enabled: !!key,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Get story settings for a child
 */
export function useStorySettings(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kidsMode.storySettings(childId ?? ''),
    queryFn: () => kidsModeService.getStorySettings(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update story settings
 */
export function useUpdateStorySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, input }: { childId: string; input: UpdateStorySettingsInput }) =>
      kidsModeService.updateStorySettings(childId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kidsMode.storySettings(data.child_profile_id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateStorySettings',
        userMessage: 'Failed to update story settings',
      });
    },
  });
}

// Re-export types
export type {
  KidsModeConfig,
  PersonalityConfig,
  StorySettings,
  UpdateStorySettingsInput,
};
