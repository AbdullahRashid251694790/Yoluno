/**
 * Mood Check-in Query Hooks
 *
 * React Query hooks for child mood check-ins.
 * Used for daily mood tracking and parent insights.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  moodCheckinService,
  type MoodCheckin,
  type MoodHistoryEntry,
  type MoodSummary,
  type MoodCalendarEntry,
  type MoodDistribution,
  type MoodType,
  type CreateMoodCheckinInput,
} from '@/services/moodCheckin';

/**
 * Get today's mood check-in for a child
 */
export function useTodaysMood(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.moodCheckin.today(childId ?? ''),
    queryFn: () => moodCheckinService.getTodaysMood(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Log a mood check-in for a child
 */
export function useLogMoodCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      data,
    }: {
      childId: string;
      data: CreateMoodCheckinInput;
    }) => moodCheckinService.logMoodCheckin(childId, data),
    onSuccess: (_, { childId }) => {
      // Invalidate today's mood
      queryClient.invalidateQueries({
        queryKey: queryKeys.moodCheckin.today(childId),
      });
      // Invalidate mood history
      queryClient.invalidateQueries({
        queryKey: queryKeys.moodCheckin.all,
      });
    },
  });
}

/**
 * Get mood history for a child
 */
export function useMoodHistory(childId: string | undefined, days = 30) {
  return useQuery({
    queryKey: queryKeys.moodCheckin.history(childId ?? '', days),
    queryFn: () => moodCheckinService.getMoodHistory(childId!, days),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get mood summary for a child
 */
export function useMoodSummary(childId: string | undefined, days = 7) {
  return useQuery({
    queryKey: queryKeys.moodCheckin.summary(childId ?? '', days),
    queryFn: () => moodCheckinService.getMoodSummary(childId!, days),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get mood calendar data for a child (for visualization)
 */
export function useMoodCalendar(childId: string | undefined, month: string) {
  return useQuery({
    queryKey: queryKeys.moodCheckin.calendar(childId ?? '', month),
    queryFn: () => moodCheckinService.getMoodCalendar(childId!, month),
    enabled: !!childId && !!month,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get mood distribution for a child (for charts)
 */
export function useMoodDistribution(childId: string | undefined, days = 7) {
  return useQuery({
    queryKey: queryKeys.moodCheckin.distribution(childId ?? '', days),
    queryFn: () => moodCheckinService.getMoodDistribution(childId!, days),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

// Re-export types for convenience
export type {
  MoodCheckin,
  MoodHistoryEntry,
  MoodSummary,
  MoodCalendarEntry,
  MoodDistribution,
  MoodType,
  CreateMoodCheckinInput,
};
