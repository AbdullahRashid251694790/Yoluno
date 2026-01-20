/**
 * Journey Reminders Service
 *
 * Data access layer for journey reminder settings and operations.
 */

import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api';

const CONTEXT = 'journeyReminders';

export interface ReminderSettings {
  id: string;
  child_profile_id: string;
  reminders_enabled: boolean;
  reminder_interval_hours: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_reminders_per_day: number;
  reminder_tone: 'encouraging' | 'playful' | 'gentle';
  created_at: string;
  updated_at: string;
}

export interface ReminderSettingsUpdate {
  reminders_enabled?: boolean;
  reminder_interval_hours?: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  max_reminders_per_day?: number;
  reminder_tone?: 'encouraging' | 'playful' | 'gentle';
}

export interface JourneyReminder {
  id: string;
  child_profile_id: string;
  journey_id: string;
  journey_step_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  message_content: string | null;
  status: 'pending' | 'sent' | 'skipped' | 'cancelled';
  created_at: string;
  journey_title?: string;
  step_title?: string;
}

/**
 * Get reminder settings for a child
 */
export async function getReminderSettings(childId: string): Promise<ReminderSettings> {
  return apiGet<ReminderSettings>(
    `/journey-reminders/settings/${childId}`,
    `${CONTEXT}.getReminderSettings`
  );
}

/**
 * Update reminder settings for a child
 */
export async function updateReminderSettings(
  childId: string,
  settings: ReminderSettingsUpdate
): Promise<ReminderSettings> {
  return apiPut<ReminderSettings>(
    `/journey-reminders/settings/${childId}`,
    `${CONTEXT}.updateReminderSettings`,
    settings
  );
}

/**
 * Get scheduled reminders for a child
 */
export async function getReminders(childId: string, status?: string): Promise<JourneyReminder[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;

  return apiGet<JourneyReminder[]>(
    `/journey-reminders/${childId}`,
    `${CONTEXT}.getReminders`,
    { params, defaultValue: [] }
  );
}

/**
 * Get due reminders for a child
 */
export async function getDueReminders(childId: string): Promise<JourneyReminder[]> {
  return apiGet<JourneyReminder[]>(
    `/journey-reminders/${childId}/due`,
    `${CONTEXT}.getDueReminders`,
    { defaultValue: [] }
  );
}

/**
 * Schedule reminders for a child's journeys
 */
export async function scheduleReminders(
  childId: string,
  journeyId?: string
): Promise<{ message: string; scheduled: number }> {
  return apiPost<{ message: string; scheduled: number }>(
    `/journey-reminders/${childId}/schedule`,
    `${CONTEXT}.scheduleReminders`,
    { journey_id: journeyId }
  );
}

/**
 * Cancel a reminder
 */
export async function cancelReminder(reminderId: string): Promise<void> {
  return apiDelete(`/journey-reminders/${reminderId}`, `${CONTEXT}.cancelReminder`);
}

/**
 * Mark a reminder as sent
 */
export async function markReminderSent(
  reminderId: string,
  messageContent?: string
): Promise<void> {
  return apiPut(
    `/journey-reminders/${reminderId}/sent`,
    `${CONTEXT}.markReminderSent`,
    { message_content: messageContent }
  );
}

export const journeyRemindersService = {
  getSettings: getReminderSettings,
  updateSettings: updateReminderSettings,
  getReminders,
  getDueReminders,
  scheduleReminders,
  cancelReminder,
  markReminderSent,
};
