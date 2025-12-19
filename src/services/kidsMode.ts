/**
 * Kids Mode Service
 *
 * Kids mode configuration and story settings.
 * All data from database - no hardcoding.
 */

import { apiGet, apiPut } from '@/lib/api';

const CONTEXT = 'kidsMode';

// Types
export interface KidsModeConfig {
  id: string;
  mode_key: string;
  label: string;
  description: string | null;
  icon_name: string;
  color_class: string;
  route_path: string;
  is_enabled: boolean;
  display_order: number;
}

export interface PersonalityConfig {
  id: string;
  mode_key: string;
  label: string;
  description: string;
  emoji: string;
  prompt_style: string;
  example_greeting: string | null;
  is_enabled: boolean;
  display_order: number;
}

export interface StorySettings {
  id: string;
  child_profile_id: string;
  bedtime_enabled: boolean;
  auto_play_stories: boolean;
  dim_level: number;
  auto_advance_delay_seconds: number;
  preferred_voice: string;
  font_size: 'small' | 'medium' | 'large' | 'xlarge';
  show_illustrations: boolean;
}

export interface UpdateStorySettingsInput {
  bedtime_enabled?: boolean;
  auto_play_stories?: boolean;
  dim_level?: number;
  auto_advance_delay_seconds?: number;
  preferred_voice?: string;
  font_size?: 'small' | 'medium' | 'large' | 'xlarge';
  show_illustrations?: boolean;
}

// API Functions

async function getModeConfigs(): Promise<KidsModeConfig[]> {
  return apiGet<KidsModeConfig[]>('/kids-mode/configs', `${CONTEXT}.getModeConfigs`);
}

async function getPersonalityConfigs(): Promise<PersonalityConfig[]> {
  return apiGet<PersonalityConfig[]>('/kids-mode/personalities', `${CONTEXT}.getPersonalityConfigs`);
}

async function getPersonality(key: string): Promise<PersonalityConfig> {
  return apiGet<PersonalityConfig>(`/kids-mode/personality/${key}`, `${CONTEXT}.getPersonality`);
}

async function getStorySettings(childId: string): Promise<StorySettings> {
  return apiGet<StorySettings>(`/kids-mode/story-settings/${childId}`, `${CONTEXT}.getStorySettings`);
}

async function updateStorySettings(childId: string, input: UpdateStorySettingsInput): Promise<StorySettings> {
  return apiPut<StorySettings>(`/kids-mode/story-settings/${childId}`, `${CONTEXT}.updateStorySettings`, input);
}

export const kidsModeService = {
  getModeConfigs,
  getPersonalityConfigs,
  getPersonality,
  getStorySettings,
  updateStorySettings,
};
