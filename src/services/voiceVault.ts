/**
 * Voice Vault Service
 *
 * Voice clip management for family recordings.
 * All data from database - no hardcoding.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

const CONTEXT = 'voiceVault';

// Types
export type VoiceClipCategoryType = 'encouragement' | 'praise' | 'celebration' | 'story' | 'memory' | 'greeting' | 'message' | 'other';

export interface VoiceClip {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  family_member_id: string | null;
  title: string;
  description: string | null;
  category: VoiceClipCategoryType;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes: number | null;
  transcription: string | null;
  is_favorite: boolean;
  play_count: number;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  child_name?: string | null;
  family_member_name?: string | null;
}

export interface VoiceClipCategoryInfo {
  key: string;
  label: string;
  icon: string;
}

export interface VoiceClipFilters {
  childId?: string;
  familyMemberId?: string;
  category?: VoiceClipCategoryType;
  favorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface VoiceClipListResponse {
  items: VoiceClip[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateVoiceClipInput {
  child_profile_id?: string;
  family_member_id?: string;
  title: string;
  description?: string;
  category: VoiceClipCategoryType;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes?: number;
  transcription?: string;
  tags?: string[];
}

export interface UpdateVoiceClipInput {
  title?: string;
  description?: string;
  category?: VoiceClipCategoryType;
  transcription?: string;
  tags?: string[];
  family_member_id?: string | null;
}

// API Functions

async function getClips(filters: VoiceClipFilters = {}): Promise<VoiceClipListResponse> {
  const params = new URLSearchParams();
  if (filters.childId) params.append('childId', filters.childId);
  if (filters.familyMemberId) params.append('familyMemberId', filters.familyMemberId);
  if (filters.category) params.append('category', filters.category);
  if (filters.favorite) params.append('favorite', 'true');
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const url = `/voice-vault${queryString ? `?${queryString}` : ''}`;
  return apiGet<VoiceClipListResponse>(url, `${CONTEXT}.getClips`);
}

async function getClip(id: string): Promise<VoiceClip> {
  return apiGet<VoiceClip>(`/voice-vault/${id}`, `${CONTEXT}.getClip`);
}

async function getCategories(): Promise<VoiceClipCategoryInfo[]> {
  return apiGet<VoiceClipCategoryInfo[]>('/voice-vault/categories', `${CONTEXT}.getCategories`);
}

async function create(input: CreateVoiceClipInput): Promise<VoiceClip> {
  return apiPost<VoiceClip>('/voice-vault', `${CONTEXT}.create`, input);
}

async function update(id: string, input: UpdateVoiceClipInput): Promise<VoiceClip> {
  return apiPut<VoiceClip>(`/voice-vault/${id}`, `${CONTEXT}.update`, input);
}

async function toggleFavorite(id: string): Promise<VoiceClip> {
  return apiPut<VoiceClip>(`/voice-vault/${id}/favorite`, `${CONTEXT}.toggleFavorite`, {});
}

async function recordPlay(id: string): Promise<void> {
  await apiPost<{ message: string }>(`/voice-vault/${id}/play`, `${CONTEXT}.recordPlay`, {});
}

async function deleteClip(id: string): Promise<void> {
  await apiDelete(`/voice-vault/${id}`, `${CONTEXT}.delete`);
}

export const voiceVaultService = {
  getClips,
  getClip,
  getCategories,
  create,
  update,
  toggleFavorite,
  recordPlay,
  delete: deleteClip,
};
