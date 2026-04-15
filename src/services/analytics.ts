/**
 * Analytics Service
 *
 * Data access layer for parent dashboard analytics.
 * All data from database - no hardcoding.
 */

import { apiGet } from '@/lib/api';

const CONTEXT = 'analytics';

// Types
export interface ActivityTimelineEntry {
  date: string;
  message_count: number;
  story_count: number;
  journey_steps_completed: number;
  session_duration_minutes: number;
}

export interface WeeklySummary {
  total_messages: number;
  total_stories: number;
  total_journey_steps: number;
  total_session_minutes: number;
  average_daily_messages: number;
  most_active_day: string | null;
  topics_explored: string[];
}

export interface ChatTopicEntry {
  category_name: string | null;
  topic: string;
  mention_count: number;
  last_mentioned_at: string;
}

export interface JourneyProgressEntry {
  id: string;
  title: string;
  status: string;
  progress_percent: number;
  steps_completed: number;
  total_steps: number;
  started_at: string;
  completed_at: string | null;
}

export interface ChildOverviewStats {
  total_points: number;
  current_streak: number;
  total_stories: number;
  total_journeys_completed: number;
}

export interface ChildWeeklyActivity {
  messages: number;
  stories: number;
}

export interface ChildOverview {
  child: {
    id: string;
    name: string;
    age: number;
    avatar_url: string | null;
  };
  stats: ChildOverviewStats;
  weekly_activity: ChildWeeklyActivity;
  chat_topics: string[];
}

export interface AnalyticsOverview {
  children: ChildOverview[];
  total_children: number;
  topics_explored: number;
  family_memories: number;
  stories_created: number;
  active_journeys: number;
}

/**
 * Get activity timeline for a child
 */
export async function getActivityTimeline(
  childId: string,
  days = 30
): Promise<ActivityTimelineEntry[]> {
  return apiGet<ActivityTimelineEntry[]>(
    `/analytics/activity/${childId}`,
    `${CONTEXT}.getActivityTimeline`,
    { params: { days: days.toString() }, defaultValue: [] }
  );
}

/**
 * Get weekly summary for a child
 */
export async function getWeeklySummary(childId: string): Promise<WeeklySummary> {
  return apiGet<WeeklySummary>(
    `/analytics/weekly-summary/${childId}`,
    `${CONTEXT}.getWeeklySummary`
  );
}

/**
 * Get chat topics for a child
 */
export async function getChatTopics(
  childId: string,
  limit = 20
): Promise<ChatTopicEntry[]> {
  return apiGet<ChatTopicEntry[]>(
    `/analytics/chat-topics/${childId}`,
    `${CONTEXT}.getChatTopics`,
    { params: { limit: limit.toString() }, defaultValue: [] }
  );
}

/**
 * Get journey progress for a child
 */
export async function getJourneyProgress(
  childId: string
): Promise<JourneyProgressEntry[]> {
  return apiGet<JourneyProgressEntry[]>(
    `/analytics/journey-progress/${childId}`,
    `${CONTEXT}.getJourneyProgress`,
    { defaultValue: [] }
  );
}

/**
 * Get analytics overview for all children
 */
export async function getOverview(): Promise<AnalyticsOverview> {
  return apiGet<AnalyticsOverview>(
    '/analytics/overview',
    `${CONTEXT}.getOverview`
  );
}

export const analyticsService = {
  getActivityTimeline,
  getWeeklySummary,
  getChatTopics,
  getJourneyProgress,
  getOverview,
};
