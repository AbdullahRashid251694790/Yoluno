/**
 * Family Query Hooks
 *
 * React Query hooks for family member operations.
 * Refactored to use mutation factory for DRY compliance.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createMutationHook } from './useMutationFactory';
import { familyService } from '@/services/family';
import type {
  FamilyMemberInsert,
  FamilyMemberUpdate,
  FamilyMemberRow,
  FamilyRelationshipInsert,
  FamilyRelationshipRow,
} from '@/types/database';

// Query hooks
export function useFamilyMembers(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.family.members(userId ?? ''),
    queryFn: () => familyService.getMembers(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFamilyMember(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.family.member(id ?? ''),
    queryFn: () => familyService.getMemberById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFamilyRelationships(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.family.relationships(userId ?? ''),
    queryFn: () => familyService.getRelationships(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFamilyTree(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.family.tree(userId ?? ''),
    queryFn: () => familyService.getTree(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// Helper to get invalidation keys for family mutations
const getFamilyInvalidationKeys = (userId: string) => [
  queryKeys.family.members(userId),
  queryKeys.family.tree(userId),
];

// Mutation hooks using factory
export const useCreateFamilyMember = createMutationHook<FamilyMemberRow, FamilyMemberInsert>({
  mutationFn: familyService.createMember,
  context: 'useCreateFamilyMember',
  userMessage: 'Failed to add family member',
  invalidateKeys: (data) => getFamilyInvalidationKeys(data.user_id),
});

export const useUpdateFamilyMember = createMutationHook<
  FamilyMemberRow,
  { id: string; updates: FamilyMemberUpdate }
>({
  mutationFn: ({ id, updates }) => familyService.updateMember(id, updates),
  context: 'useUpdateFamilyMember',
  userMessage: 'Failed to update family member',
  invalidateKeys: (data) => [
    ...getFamilyInvalidationKeys(data.user_id),
    queryKeys.family.member(data.id),
  ],
});

export const useDeleteFamilyMember = createMutationHook<void, string>({
  mutationFn: familyService.deleteMember,
  context: 'useDeleteFamilyMember',
  userMessage: 'Failed to remove family member',
  invalidateKeys: () => [queryKeys.family.all],
});

export const useCreateRelationship = createMutationHook<
  FamilyRelationshipRow,
  FamilyRelationshipInsert
>({
  mutationFn: familyService.createRelationship,
  context: 'useCreateRelationship',
  userMessage: 'Failed to create relationship',
  invalidateKeys: (data) => [
    queryKeys.family.relationships(data.user_id),
    queryKeys.family.tree(data.user_id),
  ],
});

export const useDeleteRelationship = createMutationHook<void, string>({
  mutationFn: familyService.deleteRelationship,
  context: 'useDeleteRelationship',
  userMessage: 'Failed to remove relationship',
  invalidateKeys: () => [queryKeys.family.all],
});

export const useUploadFamilyPhoto = createMutationHook<
  string,
  { userId: string; memberId: string; file: File }
>({
  mutationFn: ({ userId, memberId, file }) => familyService.uploadPhoto(userId, memberId, file),
  context: 'useUploadFamilyPhoto',
  userMessage: 'Failed to upload photo',
  invalidateKeys: (_, { userId }) => getFamilyInvalidationKeys(userId),
});

export const useDeleteFamilyPhoto = createMutationHook<void, string>({
  mutationFn: familyService.deletePhoto,
  context: 'useDeleteFamilyPhoto',
  userMessage: 'Failed to delete photo',
});

export const useUpdateTreePositions = createMutationHook<
  void,
  { userId: string; positions: Array<{ memberId: string; positionX: number; positionY: number }> }
>({
  mutationFn: ({ userId, positions }) => familyService.updateTreePositions(userId, positions),
  context: 'useUpdateTreePositions',
  userMessage: 'Failed to save tree positions',
  invalidateKeys: (_, { userId }) => getFamilyInvalidationKeys(userId),
});
