/**
 * Kid Notifications Query Hooks
 *
 * React Query hooks for child-facing notification operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { kidNotificationsService, type KidNotification } from '@/services/kidNotifications';

export function useKidNotifications(childId?: string) {
  return useQuery({
    queryKey: queryKeys.kidNotifications.list(childId!),
    queryFn: () => kidNotificationsService.getAll(childId!),
    enabled: !!childId,
    staleTime: 30 * 1000,
  });
}

export function useKidUnreadCount(childId?: string) {
  return useQuery({
    queryKey: queryKeys.kidNotifications.unreadCount(childId!),
    queryFn: () => kidNotificationsService.getUnreadCount(childId!),
    enabled: !!childId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkKidNotificationRead(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => kidNotificationsService.markAsRead(childId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kidNotifications.all });
    },
  });
}

export function useMarkAllKidNotificationsRead(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => kidNotificationsService.markAllAsRead(childId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kidNotifications.all });
    },
  });
}

export function useDeleteKidNotification(childId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => kidNotificationsService.delete(childId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kidNotifications.all });
    },
  });
}

export function useAddKidNotificationToCache(childId: string) {
  const queryClient = useQueryClient();

  return (notification: KidNotification) => {
    queryClient.setQueryData<KidNotification[]>(
      queryKeys.kidNotifications.list(childId),
      (old) => {
        if (!old) return [notification];
        const filtered = old.filter((n) => n.id !== notification.id);
        return [notification, ...filtered];
      }
    );
    queryClient.setQueryData<number>(
      queryKeys.kidNotifications.unreadCount(childId),
      (old) => (old ?? 0) + 1
    );
  };
}
