/**
 * Topics Query Hooks
 *
 * React Query hooks for content topics management.
 * All data from database - no hardcoding.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  topicsService,
  type TopicCategory,
  type ChildTopicSettings,
  type TopicSettingUpdate,
} from '@/services/topics';
import { handleError } from '@/lib/errors';

/**
 * Get all topic categories with topics
 */
export function useTopicCategories() {
  return useQuery({
    queryKey: queryKeys.topics.categories(),
    queryFn: topicsService.getCategories,
    staleTime: 10 * 60 * 1000, // Categories change rarely
  });
}

/**
 * Get topic settings for a child
 */
export function useChildTopicSettings(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topics.childSettings(childId ?? ''),
    queryFn: () => topicsService.getChildTopicSettings(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update a topic setting for a child
 */
export function useUpdateTopicSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      topicId,
      isAllowed,
    }: {
      childId: string;
      topicId: string;
      isAllowed: boolean;
    }) => topicsService.updateTopicSetting(childId, topicId, isAllowed),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topics.childSettings(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateTopicSetting',
        userMessage: 'Failed to update topic setting',
      });
    },
  });
}

/**
 * Bulk update topic settings for a child
 */
export function useBulkUpdateTopicSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      settings,
    }: {
      childId: string;
      settings: TopicSettingUpdate[];
    }) => topicsService.bulkUpdateTopicSettings(childId, settings),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topics.childSettings(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useBulkUpdateTopicSettings',
        userMessage: 'Failed to update topic settings',
      });
    },
  });
}

// Re-export types
export type { TopicCategory, ChildTopicSettings, TopicSettingUpdate };
