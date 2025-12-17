/**
 * Stories Service
 *
 * Data access layer for story operations.
 * Refactored to use generic API wrapper for DRY compliance.
 */

import { apiGet, apiGetOrNull, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { StoryRow, StoryInsert, StoryUpdate } from '@/types/database';

export interface StoryWithDetails extends StoryRow {
  childName?: string;
  scenes?: StoryScene[];
}

export interface StoryScene {
  id: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  order: number;
}

const CONTEXT = 'stories';

export async function getStoriesByChild(childId: string): Promise<StoryWithDetails[]> {
  console.log('getStoriesByChild: Fetching stories for child:', childId);

  const data = await apiGet<StoryWithDetails[]>(
    '/stories',
    `${CONTEXT}.getStoriesByChild`,
    { params: { childId }, defaultValue: [] }
  );

  console.log('getStoriesByChild: Result:', { count: data?.length });
  return data;
}

export async function getStoryById(id: string): Promise<StoryWithDetails | null> {
  return apiGetOrNull<StoryWithDetails>(`/stories/${id}`, `${CONTEXT}.getStoryById`);
}

export async function createStory(story: StoryInsert): Promise<StoryRow> {
  return apiPost<StoryRow>('/stories', `${CONTEXT}.createStory`, story);
}

export async function updateStory(id: string, updates: StoryUpdate): Promise<StoryRow> {
  return apiPut<StoryRow>(`/stories/${id}`, `${CONTEXT}.updateStory`, updates);
}

export async function deleteStory(id: string): Promise<void> {
  return apiDelete(`/stories/${id}`, `${CONTEXT}.deleteStory`);
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<StoryRow> {
  return apiPut<StoryRow>(
    `/stories/${id}/favorite`,
    `${CONTEXT}.toggleFavorite`,
    { is_favorite: isFavorite }
  );
}

export async function getFavoriteStories(childId: string): Promise<StoryWithDetails[]> {
  return apiGet<StoryWithDetails[]>(
    '/stories/favorites',
    `${CONTEXT}.getFavoriteStories`,
    { params: { childId }, defaultValue: [] }
  );
}

export async function getRecentStories(
  userId: string,
  limit = 10
): Promise<StoryWithDetails[]> {
  return apiGet<StoryWithDetails[]>(
    '/stories/recent',
    `${CONTEXT}.getRecentStories`,
    { params: { limit }, defaultValue: [] }
  );
}

export const storiesService = {
  getByChild: getStoriesByChild,
  getById: getStoryById,
  create: createStory,
  update: updateStory,
  delete: deleteStory,
  toggleFavorite,
  getFavorites: getFavoriteStories,
  getRecent: getRecentStories,
};
