/**
 * Journey Reminders Query Hooks
 *
 * React Query hooks for journey reminder settings and operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  journeyRemindersService,
  type ReminderSettingsUpdate,
} from '@/services/journeyReminders';
import { handleError } from '@/lib/errors';

/**
 * Get reminder settings for a child
 */
export function useReminderSettings(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeyReminders.settings(childId ?? ''),
    queryFn: () => journeyRemindersService.getSettings(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update reminder settings
 */
export function useUpdateReminderSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      settings,
    }: {
      childId: string;
      settings: ReminderSettingsUpdate;
    }) => journeyRemindersService.updateSettings(childId, settings),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.journeyReminders.settings(data.child_profile_id),
        data
      );
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateReminderSettings',
        userMessage: 'Failed to update reminder settings',
      });
    },
  });
}

/**
 * Get reminders for a child
 */
export function useReminders(childId: string | undefined, status?: string) {
  return useQuery({
    queryKey: queryKeys.journeyReminders.list(childId ?? '', status),
    queryFn: () => journeyRemindersService.getReminders(childId!, status),
    enabled: !!childId,
    staleTime: 60 * 1000,
  });
}

/**
 * Get due reminders for a child
 */
export function useDueReminders(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeyReminders.due(childId ?? ''),
    queryFn: () => journeyRemindersService.getDueReminders(childId!),
    enabled: !!childId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Schedule reminders
 */
export function useScheduleReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, journeyId }: { childId: string; journeyId?: string }) =>
      journeyRemindersService.scheduleReminders(childId, journeyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyReminders.list(variables.childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useScheduleReminders',
        userMessage: 'Failed to schedule reminders',
      });
    },
  });
}

/**
 * Cancel a reminder
 */
export function useCancelReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reminderId: string) => journeyRemindersService.cancelReminder(reminderId),
    onSuccess: () => {
      // Invalidate all reminder lists
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'journeyReminders',
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCancelReminder',
        userMessage: 'Failed to cancel reminder',
      });
    },
  });
}
