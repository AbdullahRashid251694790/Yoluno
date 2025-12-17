/**
 * Family Query Hooks
 *
 * React Query hooks for family member operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { familyService, type FamilyMemberWithRelations } from '@/services/family';
import type {
  FamilyMemberInsert,
  FamilyMemberUpdate,
  FamilyRelationshipInsert,
} from '@/types/database';
import { handleError } from '@/lib/errors';

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

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (member: FamilyMemberInsert) => familyService.createMember(member),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.members(data.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.tree(data.user_id),
      });
      return data;
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateFamilyMember',
        userMessage: 'Failed to add family member',
      });
    },
  });
}

export function useUpdateFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: FamilyMemberUpdate }) =>
      familyService.updateMember(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.members(data.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.member(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.tree(data.user_id),
      });
      return data;
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateFamilyMember',
        userMessage: 'Failed to update family member',
      });
    },
  });
}

export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familyService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.all,
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteFamilyMember',
        userMessage: 'Failed to remove family member',
      });
    },
  });
}

export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (relationship: FamilyRelationshipInsert) =>
      familyService.createRelationship(relationship),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.relationships(data.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.tree(data.user_id),
      });
      return data;
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateRelationship',
        userMessage: 'Failed to create relationship',
      });
    },
  });
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familyService.deleteRelationship(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.all,
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteRelationship',
        userMessage: 'Failed to remove relationship',
      });
    },
  });
}

export function useUploadFamilyPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      memberId,
      file,
    }: {
      userId: string;
      memberId: string;
      file: File;
    }) => familyService.uploadPhoto(userId, memberId, file),
    onSuccess: (photoUrl, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.members(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.tree(userId),
      });
      return photoUrl;
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUploadFamilyPhoto',
        userMessage: 'Failed to upload photo',
      });
    },
  });
}

export function useDeleteFamilyPhoto() {
  return useMutation({
    mutationFn: (photoUrl: string) => familyService.deletePhoto(photoUrl),
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteFamilyPhoto',
        userMessage: 'Failed to delete photo',
      });
    },
  });
}

export function useUpdateTreePositions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      positions,
    }: {
      userId: string;
      positions: Array<{ memberId: string; positionX: number; positionY: number }>;
    }) => familyService.updateTreePositions(userId, positions),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.members(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.family.tree(userId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateTreePositions',
        userMessage: 'Failed to save tree positions',
      });
    },
  });
}
