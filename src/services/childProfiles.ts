/**
 * Child Profiles Service
 *
 * Data access layer for child profile operations.
 * Uses Railway API instead of Supabase.
 */

import { apiClient, getErrorMessage } from '@/integrations/api';
import type {
  ChildProfileRow,
  ChildProfileInsert,
  ChildProfileUpdate,
} from '@/types/database';
import { handleError } from '@/lib/errors';

export interface ChildProfileWithAvatar extends ChildProfileRow {
  avatarUrl?: string;
}

export async function getChildProfiles(userId: string): Promise<ChildProfileWithAvatar[]> {
  try {
    const { data } = await apiClient.get<ChildProfileWithAvatar[]>('/child-profiles', {
      params: { userId },
    });
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'childProfiles.getChildProfiles',
      strategy: 'throw',
    });
  }
}

export async function getChildProfileById(id: string): Promise<ChildProfileWithAvatar | null> {
  try {
    const { data } = await apiClient.get<ChildProfileWithAvatar>(`/child-profiles/${id}`);
    return data;
  } catch (error: unknown) {
    // Handle 404 as null
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw handleError(error, {
      context: 'childProfiles.getChildProfileById',
      strategy: 'throw',
    });
  }
}

export async function createChildProfile(
  profile: ChildProfileInsert
): Promise<ChildProfileRow> {
  try {
    const { data } = await apiClient.post<ChildProfileRow>('/child-profiles', profile);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'childProfiles.createChildProfile',
      strategy: 'throw',
    });
  }
}

export async function updateChildProfile(
  id: string,
  updates: ChildProfileUpdate
): Promise<ChildProfileRow> {
  try {
    const { data } = await apiClient.put<ChildProfileRow>(`/child-profiles/${id}`, updates);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'childProfiles.updateChildProfile',
      strategy: 'throw',
    });
  }
}

export async function deleteChildProfile(id: string): Promise<void> {
  try {
    await apiClient.delete(`/child-profiles/${id}`);
  } catch (error) {
    throw handleError(error, {
      context: 'childProfiles.deleteChildProfile',
      strategy: 'throw',
    });
  }
}

export async function updateChildAvatar(
  id: string,
  avatarId: string
): Promise<ChildProfileRow> {
  return updateChildProfile(id, { avatar_id: avatarId });
}

export async function updateLastActive(id: string): Promise<void> {
  try {
    await apiClient.post(`/child-profiles/${id}/activity`);
  } catch (error) {
    handleError(error, {
      context: 'childProfiles.updateLastActive',
      strategy: 'log',
    });
  }
}

export const childProfilesService = {
  getAll: getChildProfiles,
  getById: getChildProfileById,
  create: createChildProfile,
  update: updateChildProfile,
  delete: deleteChildProfile,
  updateAvatar: updateChildAvatar,
  updateLastActive,
};
