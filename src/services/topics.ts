/**
 * Topics Service
 *
 * Data access layer for content topics management.
 * All data from database - no hardcoding.
 */

import { apiGet, apiPut, apiPost } from '@/lib/api';

const CONTEXT = 'topics';

// Types
export interface Topic {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  age_appropriate_min: number;
  age_appropriate_max: number;
  is_default: boolean;
  category_name?: string;
  is_allowed?: boolean;
}

export interface TopicCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  topics: Topic[];
}

export interface ChildTopicSettings {
  child_id: string;
  child_age: number;
  topics: Topic[];
}

export interface TopicSettingUpdate {
  topic_id: string;
  is_allowed: boolean;
}

/**
 * Get all topic categories with topics
 */
export async function getCategories(): Promise<TopicCategory[]> {
  return apiGet<TopicCategory[]>(
    '/topics/categories',
    `${CONTEXT}.getCategories`,
    { defaultValue: [] }
  );
}

/**
 * Get topic settings for a child
 */
export async function getChildTopicSettings(
  childId: string
): Promise<ChildTopicSettings> {
  return apiGet<ChildTopicSettings>(
    `/topics/child/${childId}`,
    `${CONTEXT}.getChildTopicSettings`
  );
}

/**
 * Update a single topic setting for a child
 */
export async function updateTopicSetting(
  childId: string,
  topicId: string,
  isAllowed: boolean
): Promise<{ topic_id: string; is_allowed: boolean }> {
  return apiPut<{ topic_id: string; is_allowed: boolean }>(
    `/topics/child/${childId}/${topicId}`,
    `${CONTEXT}.updateTopicSetting`,
    { is_allowed: isAllowed }
  );
}

/**
 * Bulk update topic settings for a child
 */
export async function bulkUpdateTopicSettings(
  childId: string,
  settings: TopicSettingUpdate[]
): Promise<{ message: string; count: number }> {
  return apiPost<{ message: string; count: number }>(
    `/topics/child/${childId}/bulk`,
    `${CONTEXT}.bulkUpdateTopicSettings`,
    { settings }
  );
}

export const topicsService = {
  getCategories,
  getChildTopicSettings,
  updateTopicSetting,
  bulkUpdateTopicSettings,
};
