/**
 * Family Service
 *
 * Data access layer for family member operations.
 * Refactored to use generic API wrapper for DRY compliance.
 */

import { apiGet, apiGetOrNull, apiPost, apiPut, apiDelete, apiPostFormData } from '@/lib/api';
import type {
  FamilyMemberRow,
  FamilyMemberInsert,
  FamilyMemberUpdate,
  FamilyRelationshipRow,
  FamilyRelationshipInsert,
} from '@/types/database';

export interface FamilyMemberWithRelations extends FamilyMemberRow {
  relationships?: FamilyRelationshipRow[];
}

const CONTEXT = 'family';

export async function getFamilyMembers(userId: string): Promise<FamilyMemberWithRelations[]> {
  return apiGet<FamilyMemberWithRelations[]>(
    '/family/members',
    `${CONTEXT}.getFamilyMembers`,
    { defaultValue: [] }
  );
}

export async function getFamilyMemberById(id: string): Promise<FamilyMemberWithRelations | null> {
  return apiGetOrNull<FamilyMemberWithRelations>(
    `/family/members/${id}`,
    `${CONTEXT}.getFamilyMemberById`
  );
}

export async function createFamilyMember(member: FamilyMemberInsert): Promise<FamilyMemberRow> {
  return apiPost<FamilyMemberRow>('/family/members', `${CONTEXT}.createFamilyMember`, member);
}

export async function updateFamilyMember(
  id: string,
  updates: FamilyMemberUpdate
): Promise<FamilyMemberRow> {
  return apiPut<FamilyMemberRow>(
    `/family/members/${id}`,
    `${CONTEXT}.updateFamilyMember`,
    updates
  );
}

export async function deleteFamilyMember(id: string): Promise<void> {
  return apiDelete(`/family/members/${id}`, `${CONTEXT}.deleteFamilyMember`);
}

export async function getRelationships(userId: string): Promise<FamilyRelationshipRow[]> {
  return apiGet<FamilyRelationshipRow[]>(
    '/family/relationships',
    `${CONTEXT}.getRelationships`,
    { defaultValue: [] }
  );
}

export async function createRelationship(
  relationship: FamilyRelationshipInsert
): Promise<FamilyRelationshipRow> {
  return apiPost<FamilyRelationshipRow>(
    '/family/relationships',
    `${CONTEXT}.createRelationship`,
    relationship
  );
}

export async function deleteRelationship(id: string): Promise<void> {
  return apiDelete(`/family/relationships/${id}`, `${CONTEXT}.deleteRelationship`);
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
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiPostFormData<{ url: string }>(
    '/upload/family-photos',
    `${CONTEXT}.uploadFamilyPhoto`,
    formData
  );

  return response.url;
}

export async function updateTreePositions(
  userId: string,
  positions: Array<{ memberId: string; positionX: number; positionY: number }>
): Promise<void> {
  await Promise.all(
    positions.map((pos) =>
      apiPut(
        `/family/members/${pos.memberId}`,
        `${CONTEXT}.updateTreePositions`,
        { position_x: pos.positionX, position_y: pos.positionY }
      )
    )
  );
}

export async function deleteFamilyPhoto(photoUrl: string): Promise<void> {
  const urlParts = photoUrl.split('/family-photos/');
  if (urlParts.length < 2) return;

  const parts = urlParts[1].split('/');
  const filename = parts[parts.length - 1];

  return apiDelete(`/upload/family-photos/${filename}`, `${CONTEXT}.deleteFamilyPhoto`);
}

export interface ExtractedFamilyData {
  name: string;
  relationship: string;
  occupation: string | null;
  hobbies: string[];
  funFacts: string | null;
  connectionDescription: string | null;
  isLiving: boolean;
}

export async function extractFromDescription(transcription: string): Promise<ExtractedFamilyData> {
  return apiPost<ExtractedFamilyData>(
    '/family/extract-from-description',
    `${CONTEXT}.extractFromDescription`,
    { transcription }
  );
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
  extractFromDescription,
};
