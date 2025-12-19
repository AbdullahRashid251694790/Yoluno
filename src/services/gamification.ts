/**
 * Gamification Service
 *
 * Data access layer for gamification operations.
 * All data comes from database - no hardcoding.
 */

import { apiGet, apiPost } from '@/lib/api';

// Types matching backend
export interface ActivityType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  points_value: number;
  icon_name: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface ChildStats {
  id: string;
  child_profile_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_activities: number;
  total_stories: number;
  total_journeys_completed: number;
  total_chat_messages: number;
  created_at: string;
  updated_at: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon_url: string;
  requirement_type: string;
  requirement_value: number;
  requirement_metadata: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface BadgeEarned {
  id: string;
  child_profile_id: string;
  badge_definition_id: string;
  earned_at: string;
  notified: boolean;
  badge: BadgeDefinition;
}

export interface GamificationStatsResponse {
  stats: ChildStats;
  recentBadges: BadgeEarned[];
  unnotifiedBadges: BadgeEarned[];
}

export interface BadgesResponse {
  earned: BadgeEarned[];
  available: BadgeDefinition[];
}

export interface ChildActivity {
  id: string;
  child_profile_id: string;
  activity_type_id: string;
  points_earned: number;
  metadata: Record<string, unknown>;
  created_at: string;
  activity_type?: ActivityType;
}

export interface LogActivityResponse {
  activity: ChildActivity;
  pointsEarned: number;
  newBadges: BadgeDefinition[];
  streakUpdated: boolean;
  newStreak: number;
  stats: ChildStats;
}

export interface LeaderboardEntry extends ChildStats {
  child_name: string;
}

const CONTEXT = 'gamification';

// Get all activity types
export async function getActivityTypes(): Promise<ActivityType[]> {
  return apiGet<ActivityType[]>(
    '/gamification/activity-types',
    `${CONTEXT}.getActivityTypes`,
    { defaultValue: [] }
  );
}

// Get child's gamification stats
export async function getChildStats(childId: string): Promise<GamificationStatsResponse> {
  return apiGet<GamificationStatsResponse>(
    `/gamification/stats/${childId}`,
    `${CONTEXT}.getChildStats`
  );
}

// Get all badges for a child
export async function getChildBadges(childId: string): Promise<BadgesResponse> {
  return apiGet<BadgesResponse>(
    `/gamification/badges/${childId}`,
    `${CONTEXT}.getChildBadges`
  );
}

// Log an activity
export async function logActivity(
  childId: string,
  activityTypeName: string,
  metadata?: Record<string, unknown>
): Promise<LogActivityResponse> {
  return apiPost<LogActivityResponse>(
    `/gamification/activity/${childId}`,
    `${CONTEXT}.logActivity`,
    { activityTypeName, metadata }
  );
}

// Acknowledge badges (mark as notified)
export async function acknowledgeBadges(
  childId: string,
  badgeIds: string[]
): Promise<{ message: string; count: number }> {
  return apiPost<{ message: string; count: number }>(
    `/gamification/badges/${childId}/acknowledge`,
    `${CONTEXT}.acknowledgeBadges`,
    { badgeIds }
  );
}

// Get leaderboard (family leaderboard)
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiGet<LeaderboardEntry[]>(
    '/gamification/leaderboard',
    `${CONTEXT}.getLeaderboard`,
    { defaultValue: [] }
  );
}

// Get recent activities for a child
export async function getChildActivities(
  childId: string,
  limit = 20,
  offset = 0
): Promise<ChildActivity[]> {
  return apiGet<ChildActivity[]>(
    `/gamification/activities/${childId}`,
    `${CONTEXT}.getChildActivities`,
    { params: { limit, offset }, defaultValue: [] }
  );
}

export const gamificationService = {
  getActivityTypes,
  getChildStats,
  getChildBadges,
  logActivity,
  acknowledgeBadges,
  getLeaderboard,
  getChildActivities,
};
