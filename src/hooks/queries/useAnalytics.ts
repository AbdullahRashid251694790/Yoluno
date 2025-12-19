/**
 * Analytics Query Hooks
 *
 * React Query hooks for parent dashboard analytics.
 * All data from database - no hardcoding.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  analyticsService,
  type ActivityTimelineEntry,
  type WeeklySummary,
  type ChatTopicEntry,
  type JourneyProgressEntry,
  type AnalyticsOverview,
} from '@/services/analytics';

/**
 * Get activity timeline for a child
 */
export function useActivityTimeline(childId: string | undefined, days = 30) {
  return useQuery({
    queryKey: queryKeys.analytics.activity(childId ?? '', days),
    queryFn: () => analyticsService.getActivityTimeline(childId!, days),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get weekly summary for a child
 */
export function useWeeklySummary(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analytics.weekly(childId ?? ''),
    queryFn: () => analyticsService.getWeeklySummary(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get chat topics for a child
 */
export function useChatTopics(childId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: queryKeys.analytics.topics(childId ?? '', limit),
    queryFn: () => analyticsService.getChatTopics(childId!, limit),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get journey progress for a child
 */
export function useJourneyProgressAnalytics(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analytics.journeyProgress(childId ?? ''),
    queryFn: () => analyticsService.getJourneyProgress(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get analytics overview for all children
 */
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn: analyticsService.getOverview,
    staleTime: 5 * 60 * 1000,
  });
}

// Re-export types for convenience
export type {
  ActivityTimelineEntry,
  WeeklySummary,
  ChatTopicEntry,
  JourneyProgressEntry,
  AnalyticsOverview,
};
