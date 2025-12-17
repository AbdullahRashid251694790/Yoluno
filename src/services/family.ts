/**
 * Family Service
 *
 * Data access layer for family member operations.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import type {
  FamilyMemberRow,
  FamilyMemberInsert,
  FamilyMemberUpdate,
  FamilyRelationshipRow,
  FamilyRelationshipInsert,
} from '@/types/database';
import { handleError } from '@/lib/errors';

export interface FamilyMemberWithRelations extends FamilyMemberRow {
  relationships?: FamilyRelationshipRow[];
}

export async function getFamilyMembers(userId: string): Promise<FamilyMemberWithRelations[]> {
  try {
    const { data } = await apiClient.get<FamilyMemberWithRelations[]>('/family/members');
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'family.getFamilyMembers',
      strategy: 'throw',
    });
  }
}

export async function getFamilyMemberById(id: string): Promise<FamilyMemberWithRelations | null> {
  try {
    const { data } = await apiClient.get<FamilyMemberWithRelations>(`/family/members/${id}`);
    return data;
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw handleError(error, {
      context: 'family.getFamilyMemberById',
      strategy: 'throw',
    });
  }
}

export async function createFamilyMember(
  member: FamilyMemberInsert
): Promise<FamilyMemberRow> {
  try {
    const { data } = await apiClient.post<FamilyMemberRow>('/family/members', member);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'family.createFamilyMember',
      strategy: 'throw',
    });
  }
}

export async function updateFamilyMember(
  id: string,
  updates: FamilyMemberUpdate
): Promise<FamilyMemberRow> {
  try {
    const { data } = await apiClient.put<FamilyMemberRow>(`/family/members/${id}`, updates);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'family.updateFamilyMember',
      strategy: 'throw',
    });
  }
}

export async function deleteFamilyMember(id: string): Promise<void> {
  try {
    await apiClient.delete(`/family/members/${id}`);
  } catch (error) {
    throw handleError(error, {
      context: 'family.deleteFamilyMember',
      strategy: 'throw',
    });
  }
}

export async function getRelationships(userId: string): Promise<FamilyRelationshipRow[]> {
  try {
    const { data } = await apiClient.get<FamilyRelationshipRow[]>('/family/relationships');
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'family.getRelationships',
      strategy: 'throw',
    });
  }
}

export async function createRelationship(
  relationship: FamilyRelationshipInsert
): Promise<FamilyRelationshipRow> {
  try {
    const { data } = await apiClient.post<FamilyRelationshipRow>('/family/relationships', relationship);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'family.createRelationship',
      strategy: 'throw',
    });
  }
}

export async function deleteRelationship(id: string): Promise<void> {
  try {
    await apiClient.delete(`/family/relationships/${id}`);
  } catch (error) {
    throw handleError(error, {
      context: 'family.deleteRelationship',
      strategy: 'throw',
    });
  }
}

export async function getFamilyTree(userId: string): Promise<{
  members: FamilyMemberWithRelations[];
  relationships: FamilyRelationshipRow[];
}> {
  const [members, relationships] = await Promise.all([
    getFamilyMembers(userId),
    getRelationships(userId),
  ]);

  return { members, relationships };
}

export async function uploadFamilyPhoto(
  userId: string,
  memberId: string,
  file: File
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<{ url: string }>(
      '/upload/family-photos',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return data.url;
  } catch (error) {
    throw handleError(error, {
      context: 'family.uploadFamilyPhoto',
      strategy: 'throw',
    });
  }
}

export async function updateTreePositions(
  userId: string,
  positions: Array<{ memberId: string; positionX: number; positionY: number }>
): Promise<void> {
  try {
    // Update each position
    await Promise.all(
      positions.map((pos) =>
        apiClient.put(`/family/members/${pos.memberId}`, {
          position_x: pos.positionX,
          position_y: pos.positionY,
        })
      )
    );
  } catch (error) {
    throw handleError(error, {
      context: 'family.updateTreePositions',
      strategy: 'throw',
    });
  }
}

export async function deleteFamilyPhoto(photoUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = photoUrl.split('/family-photos/');
    if (urlParts.length < 2) return;

    const parts = urlParts[1].split('/');
    const filename = parts[parts.length - 1];

    await apiClient.delete(`/upload/family-photos/${filename}`);
  } catch (error) {
    throw handleError(error, {
      context: 'family.deleteFamilyPhoto',
      strategy: 'throw',
    });
  }
}

export const familyService = {
  getMembers: getFamilyMembers,
  getMemberById: getFamilyMemberById,
  createMember: createFamilyMember,
  updateMember: updateFamilyMember,
  deleteMember: deleteFamilyMember,
  getRelationships,
  createRelationship,
  deleteRelationship,
  getTree: getFamilyTree,
  uploadPhoto: uploadFamilyPhoto,
  deletePhoto: deleteFamilyPhoto,
  updateTreePositions,
};
