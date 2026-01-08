/**
 * Story Generation Service
 *
 * Client-side service for AI story generation.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import { handleError } from '@/lib/errors';

export interface StoryCharacter {
  name: string;
  gender?: 'boy' | 'girl';
}

export interface StoryGenerationRequest {
  childProfileId: string;
  theme: string;
  characters?: StoryCharacter[];
  mood?: string;
  values?: string[];
  storyLength?: 'short' | 'medium' | 'long';
  includeFamily?: boolean;
  narratorVoice?: string;
  avatar?: 'Lolo' | 'Lumi' | 'Luno' | null;
}

export interface StoryPagePreview {
  page_number: number;
  content: string;
  illustration_status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface GeneratedStory {
  id?: string;
  title: string;
  content: string;
  moral: string;
  wordCount: number;
  theme: string;
  mood: string;
  illustrationUrl?: string | null;
  cover_image_url?: string | null;
  has_pages?: boolean;
  narrator_voice?: string;
  pages?: StoryPagePreview[];
}

export interface StoryGenerationResponse {
  story: GeneratedStory;
  warning?: string;
  saveError?: string;
}

export async function generateStory(
  request: StoryGenerationRequest
): Promise<GeneratedStory & { warning?: string }> {
  try {
    const { data } = await apiClient.post<StoryGenerationResponse>('/generate-story', {
      child_profile_id: request.childProfileId,
      theme: request.theme,
      characters: request.characters,
      mood: request.mood,
      values: request.values,
      storyLength: request.storyLength,
      includeFamily: request.includeFamily,
      narratorVoice: request.narratorVoice,
      avatar: request.avatar,
    });

    // Check for error in response data
    if ((data as unknown as { error?: string })?.error) {
      const errorData = data as unknown as { error: string; details?: string };
      console.error('Story generation API error:', errorData.error, errorData.details);
      throw new Error(errorData.details || errorData.error);
    }

    // Log warning if story wasn't saved
    if (data.warning) {
      console.warn('Story generation warning:', data.warning, data.saveError);
    }

    return {
      ...data.story,
      warning: data.warning,
    };
  } catch (error) {
    console.error('Story generation error:', error);
    throw handleError(error, {
      context: 'storyGeneration.generateStory',
      strategy: 'throw',
    });
  }
}

// Theme suggestions by age group
export function getThemeSuggestions(age: number): string[] {
  const baseThemes = ['friendship', 'kindness', 'adventure', 'animals', 'nature'];

  if (age <= 6) {
    return [...baseThemes, 'bedtime', 'colors', 'shapes', 'family'];
  }

  if (age <= 10) {
    return [...baseThemes, 'space', 'dinosaurs', 'magic', 'sports', 'science'];
  }

  return [...baseThemes, 'mystery', 'fantasy', 'history', 'invention', 'courage'];
}

// Mood options
export const storyMoods = [
  'adventurous',
  'calm',
  'funny',
  'magical',
  'exciting',
  'peaceful',
  'mysterious',
] as const;

export type StoryMood = (typeof storyMoods)[number];

// Values that can be incorporated
export const storyValues = [
  'kindness',
  'honesty',
  'courage',
  'friendship',
  'perseverance',
  'respect',
  'responsibility',
  'gratitude',
  'empathy',
  'creativity',
] as const;

export type StoryValue = (typeof storyValues)[number];

export const storyGenerationService = {
  generate: generateStory,
  getThemeSuggestions,
  moods: storyMoods,
  values: storyValues,
};
