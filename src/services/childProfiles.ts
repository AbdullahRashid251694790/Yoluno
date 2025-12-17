/**
 * Child Profiles Service
 *
 * Data access layer for child profile operations.
 * Refactored to use generic API wrapper for DRY compliance.
 */

import { apiGet, apiGetOrNull, apiPost, apiPut, apiDelete } from '@/lib/api';
import type {
  ChildProfileRow,
  ChildProfileInsert,
  ChildProfileUpdate,
} from '@/types/database';

export interface ChildProfileWithAvatar extends ChildProfileRow {
  avatarUrl?: string;
}

const CONTEXT = 'childProfiles';

export async function getChildProfiles(userId: string): Promise<ChildProfileWithAvatar[]> {
  return apiGet<ChildProfileWithAvatar[]>(
    '/child-profiles',
    `${CONTEXT}.getChildProfiles`,
    { params: { userId }, defaultValue: [] }
  );
}

export async function getChildProfileById(id: string): Promise<ChildProfileWithAvatar | null> {
  return apiGetOrNull<ChildProfileWithAvatar>(
    `/child-profiles/${id}`,
    `${CONTEXT}.getChildProfileById`
  );
}

export async function createChildProfile(profile: ChildProfileInsert): Promise<ChildProfileRow> {
  return apiPost<ChildProfileRow>(
    '/child-profiles',
    `${CONTEXT}.createChildProfile`,
    profile
  );
}

export async function updateChildProfile(
  id: string,
  updates: ChildProfileUpdate
): Promise<ChildProfileRow> {
  return apiPut<ChildProfileRow>(
    `/child-profiles/${id}`,
    `${CONTEXT}.updateChildProfile`,
    updates
  );
}

export async function deleteChildProfile(id: string): Promise<void> {
  return apiDelete(`/child-profiles/${id}`, `${CONTEXT}.deleteChildProfile`);
}

export async function updateChildAvatar(
  id: string,
  avatarId: string
): Promise<ChildProfileRow> {
  return updateChildProfile(id, { avatar_id: avatarId });
}

export async function updateLastActive(id: string): Promise<void> {
  return apiPost<void>(
    `/child-profiles/${id}/activity`,
    `${CONTEXT}.updateLastActive`,
    undefined,
    { strategy: 'log' }
  );
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
