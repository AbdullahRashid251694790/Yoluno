/**
 * Notifications Service
 *
 * Data access layer for parent notification operations.
 */

import { apiClient } from '@/integrations/api';
import { handleError } from '@/lib/errors';

export type NotificationType = 'password_change_request' | 'other';

export interface ParentNotification {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  child_name?: string | null;
}

export interface NotificationsResponse {
  notifications: ParentNotification[];
}

export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<ParentNotification[]> {
  try {
    const { data } = await apiClient.get<ParentNotification[]>('/notifications', {
      params: {
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        unread_only: options?.unreadOnly,
      },
    });
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'notifications.getNotifications',
      strategy: 'throw',
    });
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return data?.count ?? 0;
  } catch (error) {
    throw handleError(error, {
      context: 'notifications.getUnreadCount',
      strategy: 'throw',
    });
  }
}

export async function markAsRead(notificationId: string): Promise<ParentNotification> {
  try {
    const { data } = await apiClient.post<ParentNotification>(
      `/notifications/${notificationId}/read`
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'notifications.markAsRead',
      strategy: 'throw',
    });
  }
}

export async function markAllAsRead(): Promise<{ count: number }> {
  try {
    const { data } = await apiClient.post<{ message: string; count: number }>(
      '/notifications/read-all'
    );
    return { count: data?.count ?? 0 };
  } catch (error) {
    throw handleError(error, {
      context: 'notifications.markAllAsRead',
      strategy: 'throw',
    });
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await apiClient.delete(`/notifications/${notificationId}`);
  } catch (error) {
    throw handleError(error, {
      context: 'notifications.deleteNotification',
      strategy: 'throw',
    });
  }
}

export async function requestPasswordChange(childId: string): Promise<void> {
  try {
    await apiClient.post(`/child-profiles/${childId}/request-password-change`);
  } catch (error) {
    throw handleError(error, {
      context: 'notifications.requestPasswordChange',
      strategy: 'throw',
    });
  }
}

export const notificationsService = {
  getAll: getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  delete: deleteNotification,
  requestPasswordChange,
};
