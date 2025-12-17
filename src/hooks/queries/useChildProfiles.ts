/**
 * Child Profiles Query Hooks
 *
 * React Query hooks for child profile operations.
 * Refactored to use mutation factory for DRY compliance.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createMutationHook, createCrudMutations } from './useMutationFactory';
import {
  childProfilesService,
  type ChildProfileWithAvatar,
} from '@/services/childProfiles';
import type { ChildProfileInsert, ChildProfileUpdate } from '@/types/database';

// Query hooks
export function useChildProfiles(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.childProfiles.list(userId ?? ''),
    queryFn: () => childProfilesService.getAll(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChildProfile(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.childProfiles.detail(id ?? ''),
    queryFn: () => childProfilesService.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// CRUD Mutation hooks using factory
const { useCreate, useUpdate, useDelete } = createCrudMutations<
  ChildProfileWithAvatar,
  ChildProfileInsert,
  ChildProfileUpdate
>({
  service: {
    create: childProfilesService.create,
    update: childProfilesService.update,
    delete: childProfilesService.delete,
  },
  entityName: 'ChildProfile',
  queryKeys: {
    lists: () => queryKeys.childProfiles.lists(),
    detail: (id) => queryKeys.childProfiles.detail(id),
  },
  getId: (data) => data.id,
});

export const useCreateChildProfile = useCreate;
export const useUpdateChildProfile = useUpdate;
export const useDeleteChildProfile = useDelete;

// Custom mutation for avatar update
export const useUpdateChildAvatar = createMutationHook<
  ChildProfileWithAvatar,
  { id: string; avatarId: string }
>({
  mutationFn: ({ id, avatarId }) => childProfilesService.updateAvatar(id, avatarId),
  context: 'useUpdateChildAvatar',
  userMessage: 'Failed to update avatar',
  invalidateKeys: (data) => [
    queryKeys.childProfiles.lists(),
    queryKeys.childProfiles.detail(data.id),
  ],
});

// Prefetch utility
export function usePrefetchChildProfile() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.childProfiles.detail(id),
      queryFn: () => childProfilesService.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
