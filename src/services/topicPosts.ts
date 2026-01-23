/**
 * Topic Posts Service
 *
 * Data access layer for custom topics and topic posts management.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

const CONTEXT = 'topicPosts';

// Custom Topic types
export interface CustomTopic {
  id: string;
  child_profile_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomTopicInput {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateCustomTopicInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

// Topic Post types
export interface TopicPost {
  id: string;
  child_profile_id: string;
  topic_id: string | null;
  custom_topic_id: string | null;
  title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  topic_name?: string | null;
  custom_topic_name?: string | null;
}

export interface CreateTopicPostInput {
  topic_id?: string;
  custom_topic_id?: string;
  title: string;
  content: string;
  sort_order?: number;
}

export interface UpdateTopicPostInput {
  title?: string;
  content?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================
// Custom Topics API
// ============================================

/**
 * Get all custom topics for a child
 */
export async function getCustomTopics(childId: string): Promise<CustomTopic[]> {
  return apiGet<CustomTopic[]>(
    `/topics/child/${childId}/custom`,
    `${CONTEXT}.getCustomTopics`,
    { defaultValue: [] }
  );
}

/**
 * Create a custom topic for a child
 */
export async function createCustomTopic(
  childId: string,
  data: CreateCustomTopicInput
): Promise<CustomTopic> {
  return apiPost<CustomTopic>(
    `/topics/child/${childId}/custom`,
    `${CONTEXT}.createCustomTopic`,
    data
  );
}

/**
 * Update a custom topic
 */
export async function updateCustomTopic(
  childId: string,
  customTopicId: string,
  data: UpdateCustomTopicInput
): Promise<CustomTopic> {
  return apiPut<CustomTopic>(
    `/topics/child/${childId}/custom/${customTopicId}`,
    `${CONTEXT}.updateCustomTopic`,
    data
  );
}

/**
 * Delete a custom topic
 */
export async function deleteCustomTopic(
  childId: string,
  customTopicId: string
): Promise<void> {
  return apiDelete(
    `/topics/child/${childId}/custom/${customTopicId}`,
    `${CONTEXT}.deleteCustomTopic`
  );
}

// ============================================
// Topic Posts API
// ============================================

/**
 * Get all topic posts for a child (both system and custom topics)
 */
export async function getTopicPosts(childId: string): Promise<TopicPost[]> {
  return apiGet<TopicPost[]>(
    `/topics/child/${childId}/posts`,
    `${CONTEXT}.getTopicPosts`,
    { defaultValue: [] }
  );
}

/**
 * Create a topic post
 */
export async function createTopicPost(
  childId: string,
  data: CreateTopicPostInput
): Promise<TopicPost> {
  return apiPost<TopicPost>(
    `/topics/child/${childId}/posts`,
    `${CONTEXT}.createTopicPost`,
    data
  );
}

/**
 * Update a topic post
 */
export async function updateTopicPost(
  childId: string,
  postId: string,
  data: UpdateTopicPostInput
): Promise<TopicPost> {
  return apiPut<TopicPost>(
    `/topics/child/${childId}/posts/${postId}`,
    `${CONTEXT}.updateTopicPost`,
    data
  );
}

/**
 * Delete a topic post
 */
export async function deleteTopicPost(
  childId: string,
  postId: string
): Promise<void> {
  return apiDelete(
    `/topics/child/${childId}/posts/${postId}`,
    `${CONTEXT}.deleteTopicPost`
  );
}

export const topicPostsService = {
  // Custom topics
  getCustomTopics,
  createCustomTopic,
  updateCustomTopic,
  deleteCustomTopic,
  // Topic posts
  getTopicPosts,
  createTopicPost,
  updateTopicPost,
  deleteTopicPost,
};
