/**
 * Gamification Query Hooks
 *
 * React Query hooks for gamification operations.
 * All data comes from database - no hardcoding.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createMutationHook } from './useMutationFactory';
import {
  gamificationService,
  type GamificationStatsResponse,
  type BadgesResponse,
  type LogActivityResponse,
  type ActivityType,
  type ChildActivity,
  type LeaderboardEntry,
} from '@/services/gamification';

// ============================================================
// Query Hooks
// ============================================================

/**
 * Get all activity types from database
 */
export function useActivityTypes() {
  return useQuery({
    queryKey: queryKeys.gamification.activityTypes(),
    queryFn: gamificationService.getActivityTypes,
    staleTime: 10 * 60 * 1000, // Activity types rarely change
  });
}

/**
 * Get gamification stats for a child
 * Includes stats, recent badges, and unnotified badges
 */
export function useGamificationStats(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.gamification.stats(childId ?? ''),
    queryFn: () => gamificationService.getChildStats(childId!),
    enabled: !!childId,
    staleTime: 30 * 1000, // Stats update frequently
  });
}

/**
 * Get all badges (earned and available) for a child
 */
export function useChildBadges(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.gamification.badges(childId ?? ''),
    queryFn: () => gamificationService.getChildBadges(childId!),
    enabled: !!childId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Get recent activities for a child
 */
export function useChildActivities(
  childId: string | undefined,
  limit = 20,
  offset = 0
) {
  return useQuery({
    queryKey: [...queryKeys.gamification.activities(childId ?? ''), limit, offset],
    queryFn: () => gamificationService.getChildActivities(childId!, limit, offset),
    enabled: !!childId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get family leaderboard
 */
export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.gamification.leaderboard(),
    queryFn: gamificationService.getLeaderboard,
    staleTime: 1 * 60 * 1000,
  });
}

// ============================================================
// Mutation Hooks
// ============================================================

interface LogActivityVariables {
  childId: string;
  activityTypeName: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity for a child
 * Returns new badges earned, updated stats, and streak info
 */
export const useLogActivity = createMutationHook<LogActivityResponse, LogActivityVariables>({
  mutationFn: ({ childId, activityTypeName, metadata }) =>
    gamificationService.logActivity(childId, activityTypeName, metadata),
  context: 'useLogActivity',
  userMessage: 'Failed to log activity',
  invalidateKeys: (data, { childId }) => [
    queryKeys.gamification.stats(childId),
    queryKeys.gamification.badges(childId),
    queryKeys.gamification.activities(childId),
    queryKeys.gamification.leaderboard(),
  ],
});

interface AcknowledgeBadgesVariables {
  childId: string;
  badgeIds: string[];
}

/**
 * Acknowledge badges (mark as notified)
 */
export const useAcknowledgeBadges = createMutationHook<
  { message: string; count: number },
  AcknowledgeBadgesVariables
>({
  mutationFn: ({ childId, badgeIds }) =>
    gamificationService.acknowledgeBadges(childId, badgeIds),
  context: 'useAcknowledgeBadges',
  userMessage: 'Failed to acknowledge badges',
  invalidateKeys: (_, { childId }) => [
    queryKeys.gamification.stats(childId),
    queryKeys.gamification.badges(childId),
  ],
});

// ============================================================
// Convenience Exports
// ============================================================

export type {
  GamificationStatsResponse,
  BadgesResponse,
  LogActivityResponse,
  ActivityType,
  ChildActivity,
  LeaderboardEntry,
};
