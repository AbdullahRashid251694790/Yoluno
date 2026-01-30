/**
 * Mood Check-in Service
 *
 * Data access layer for child mood check-ins.
 * Tracks daily mood for insights and personalization.
 */

import { apiGet, apiPost } from '@/lib/api';

const CONTEXT = 'moodCheckin';

// Types
export type MoodType = 'happy' | 'sad' | 'angry' | 'scared' | 'calm';

export interface MoodCheckin {
  id: string;
  child_profile_id: string;
  mood: MoodType;
  luno_response: string | null;
  suggested_activity: string | null;
  session_id: string | null;
  created_at: string;
}

export interface CreateMoodCheckinInput {
  mood: MoodType;
  luno_response?: string;
  suggested_activity?: string;
}

export interface MoodHistoryEntry {
  date: string;
  mood: MoodType;
  created_at: string;
}

export interface MoodDistribution {
  mood: MoodType;
  count: number;
  percentage: number;
}

export interface MoodSummary {
  total_checkins: number;
  most_common_mood: MoodType | null;
  distribution: MoodDistribution[];
  recent_pattern: MoodType[];
}

export interface MoodCalendarEntry {
  date: string;
  moods: MoodType[];
  dominant_mood: MoodType | null;
}

/**
 * Log a mood check-in for a child
 */
export async function logMoodCheckin(
  childId: string,
  data: CreateMoodCheckinInput
): Promise<MoodCheckin> {
  return apiPost<MoodCheckin>(
    `/mood-checkin/${childId}`,
    `${CONTEXT}.logMoodCheckin`,
    data
  );
}

/**
 * Get today's mood check-in for a child (if exists)
 */
export async function getTodaysMood(childId: string): Promise<MoodCheckin | null> {
  return apiGet<MoodCheckin | null>(
    `/mood-checkin/${childId}/today`,
    `${CONTEXT}.getTodaysMood`,
    { defaultValue: null }
  );
}

/**
 * Get mood history for a child
 */
export async function getMoodHistory(
  childId: string,
  days = 30
): Promise<MoodHistoryEntry[]> {
  return apiGet<MoodHistoryEntry[]>(
    `/mood-checkin/${childId}/history`,
    `${CONTEXT}.getMoodHistory`,
    { params: { days: days.toString() }, defaultValue: [] }
  );
}

/**
 * Get mood summary/statistics for a child
 */
export async function getMoodSummary(
  childId: string,
  days = 7
): Promise<MoodSummary> {
  return apiGet<MoodSummary>(
    `/mood-checkin/${childId}/summary`,
    `${CONTEXT}.getMoodSummary`,
    { params: { days: days.toString() } }
  );
}

/**
 * Get mood calendar data for a child (for calendar visualization)
 */
export async function getMoodCalendar(
  childId: string,
  month: string // Format: YYYY-MM
): Promise<MoodCalendarEntry[]> {
  return apiGet<MoodCalendarEntry[]>(
    `/mood-checkin/${childId}/calendar`,
    `${CONTEXT}.getMoodCalendar`,
    { params: { month }, defaultValue: [] }
  );
}

/**
 * Get mood distribution for analytics
 */
export async function getMoodDistribution(
  childId: string,
  days = 7
): Promise<MoodDistribution[]> {
  return apiGet<MoodDistribution[]>(
    `/mood-checkin/${childId}/distribution`,
    `${CONTEXT}.getMoodDistribution`,
    { params: { days: days.toString() }, defaultValue: [] }
  );
}

export const moodCheckinService = {
  logMoodCheckin,
  getTodaysMood,
  getMoodHistory,
  getMoodSummary,
  getMoodCalendar,
  getMoodDistribution,
};
