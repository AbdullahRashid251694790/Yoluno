/**
 * Stories Service
 *
 * Data access layer for story operations.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import type { StoryRow, StoryInsert, StoryUpdate } from '@/types/database';
import { handleError } from '@/lib/errors';

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

export async function getStoriesByChild(childId: string): Promise<StoryWithDetails[]> {
  console.log('getStoriesByChild: Fetching stories for child:', childId);

  try {
    const { data } = await apiClient.get<StoryWithDetails[]>('/stories', {
      params: { childId },
    });

    console.log('getStoriesByChild: Result:', { count: data?.length });
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'stories.getStoriesByChild',
      strategy: 'throw',
    });
  }
}

export async function getStoryById(id: string): Promise<StoryWithDetails | null> {
  try {
    const { data } = await apiClient.get<StoryWithDetails>(`/stories/${id}`);
    return data;
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw handleError(error, {
      context: 'stories.getStoryById',
      strategy: 'throw',
    });
  }
}

export async function createStory(story: StoryInsert): Promise<StoryRow> {
  try {
    const { data } = await apiClient.post<StoryRow>('/stories', story);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'stories.createStory',
      strategy: 'throw',
    });
  }
}

export async function updateStory(
  id: string,
  updates: StoryUpdate
): Promise<StoryRow> {
  try {
    const { data } = await apiClient.put<StoryRow>(`/stories/${id}`, updates);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'stories.updateStory',
      strategy: 'throw',
    });
  }
}

export async function deleteStory(id: string): Promise<void> {
  try {
    await apiClient.delete(`/stories/${id}`);
  } catch (error) {
    throw handleError(error, {
      context: 'stories.deleteStory',
      strategy: 'throw',
    });
  }
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<StoryRow> {
  try {
    const { data } = await apiClient.put<StoryRow>(`/stories/${id}/favorite`, {
      is_favorite: isFavorite,
    });
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'stories.toggleFavorite',
      strategy: 'throw',
    });
  }
}

export async function getFavoriteStories(childId: string): Promise<StoryWithDetails[]> {
  try {
    const { data } = await apiClient.get<StoryWithDetails[]>('/stories/favorites', {
      params: { childId },
    });
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'stories.getFavoriteStories',
      strategy: 'throw',
    });
  }
}

export async function getRecentStories(
  userId: string,
  limit = 10
): Promise<StoryWithDetails[]> {
  try {
    const { data } = await apiClient.get<StoryWithDetails[]>('/stories/recent', {
      params: { limit },
    });
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'stories.getRecentStories',
      strategy: 'throw',
    });
  }
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
