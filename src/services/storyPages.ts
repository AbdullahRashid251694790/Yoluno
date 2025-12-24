/**
 * Story Pages Service
 *
 * Client-side service for story pages (storybook experience).
 */

import { apiClient } from '@/integrations/api';
import { handleError } from '@/lib/errors';
import type { IllustrationStatus } from '@/types/database';

export interface StoryPage {
  id: string;
  story_id: string;
  page_number: number;
  content: string;
  illustration_prompt: string | null;
  illustration_url: string | null;
  illustration_status: IllustrationStatus;
  audio_url: string | null;
  audio_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface IllustrationStatusResponse {
  total_pages: number;
  completed: number;
  failed: number;
  pages: { page_number: number; status: IllustrationStatus }[];
}

export async function getStoryPages(storyId: string): Promise<StoryPage[]> {
  try {
    const { data } = await apiClient.get<{ pages: StoryPage[] }>(
      `/generate-story/${storyId}/pages`
    );
    return data.pages;
  } catch (error) {
    throw handleError(error, {
      context: 'storyPages.getStoryPages',
      strategy: 'throw',
    });
  }
}

export async function getIllustrationStatus(
  storyId: string
): Promise<IllustrationStatusResponse> {
  try {
    const { data } = await apiClient.get<IllustrationStatusResponse>(
      `/generate-story/${storyId}/illustration-status`
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'storyPages.getIllustrationStatus',
      strategy: 'throw',
    });
  }
}

export async function regenerateIllustrations(storyId: string): Promise<void> {
  try {
    await apiClient.post(`/generate-story/${storyId}/regenerate-illustrations`);
  } catch (error) {
    throw handleError(error, {
      context: 'storyPages.regenerateIllustrations',
      strategy: 'throw',
    });
  }
}

export async function generatePageAudio(
  storyId: string,
  pageNumber: number,
  voice?: string
): Promise<{ audio: string; duration_ms?: number }> {
  try {
    const { data } = await apiClient.post<{ audio: string; duration_ms?: number }>(
      `/generate-story/${storyId}/pages/${pageNumber}/audio`,
      { voice }
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'storyPages.generatePageAudio',
      strategy: 'throw',
    });
  }
}

export const storyPagesService = {
  getPages: getStoryPages,
  getIllustrationStatus,
  regenerateIllustrations,
  generatePageAudio,
};
