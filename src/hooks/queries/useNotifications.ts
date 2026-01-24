/**
 * Notifications Query Hooks
 *
 * React Query hooks for parent notification operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { notificationsService, type ParentNotification } from '@/services/notifications';

export function useNotifications(options?: { unreadOnly?: boolean }) {
  return useQuery({
    queryKey: queryKeys.notifications.list(options),
    queryFn: () => notificationsService.getAll(options),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate both list and unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

export function useRequestPasswordChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) => notificationsService.requestPasswordChange(childId),
    onSuccess: () => {
      // The notification will be delivered via socket, but we can prefetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

// Helper hook to add a notification to the cache (for real-time updates)
export function useAddNotificationToCache() {
  const queryClient = useQueryClient();

  return (notification: ParentNotification) => {
    // Update the list cache
    queryClient.setQueryData<ParentNotification[]>(
      queryKeys.notifications.list(),
      (old) => {
        if (!old) return [notification];
        // Add to beginning, remove duplicates
        const filtered = old.filter((n) => n.id !== notification.id);
        return [notification, ...filtered];
      }
    );

    // Increment unread count
    queryClient.setQueryData<number>(
      queryKeys.notifications.unreadCount(),
      (old) => (old ?? 0) + 1
    );
  };
}
