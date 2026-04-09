/**
 * Kid Notifications Service
 *
 * Data access layer for child-facing notification operations.
 */

import { apiClient } from '@/integrations/api';
import { handleError } from '@/lib/errors';

export type KidNotificationType = 'story_complete' | 'other';

export interface KidNotification {
  id: string;
  child_profile_id: string;
  notification_type: KidNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  metadata: Record<string, unknown>;
}

export async function getKidNotifications(
  childId: string,
  options?: { limit?: number; offset?: number; unreadOnly?: boolean }
): Promise<KidNotification[]> {
  try {
    const { data } = await apiClient.get<KidNotification[]>(`/kids/${childId}/notifications`, {
      params: {
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        unread_only: options?.unreadOnly,
      },
    });
    return data ?? [];
  } catch (error) {
    throw handleError(error, { context: 'kidNotifications.getAll', strategy: 'throw' });
  }
}

export async function getKidUnreadCount(childId: string): Promise<number> {
  try {
    const { data } = await apiClient.get<{ count: number }>(`/kids/${childId}/notifications/unread-count`);
    return data?.count ?? 0;
  } catch (error) {
    throw handleError(error, { context: 'kidNotifications.getUnreadCount', strategy: 'throw' });
  }
}

export async function markKidNotificationRead(childId: string, notificationId: string): Promise<KidNotification> {
  try {
    const { data } = await apiClient.post<KidNotification>(`/kids/${childId}/notifications/${notificationId}/read`);
    return data;
  } catch (error) {
    throw handleError(error, { context: 'kidNotifications.markAsRead', strategy: 'throw' });
  }
}

export async function markAllKidNotificationsRead(childId: string): Promise<void> {
  try {
    await apiClient.post(`/kids/${childId}/notifications/read-all`);
  } catch (error) {
    throw handleError(error, { context: 'kidNotifications.markAllAsRead', strategy: 'throw' });
  }
}

export async function deleteKidNotification(childId: string, notificationId: string): Promise<void> {
  try {
    await apiClient.delete(`/kids/${childId}/notifications/${notificationId}`);
  } catch (error) {
    throw handleError(error, { context: 'kidNotifications.delete', strategy: 'throw' });
  }
}

export const kidNotificationsService = {
  getAll: getKidNotifications,
  getUnreadCount: getKidUnreadCount,
  markAsRead: markKidNotificationRead,
  markAllAsRead: markAllKidNotificationsRead,
  delete: deleteKidNotification,
};
