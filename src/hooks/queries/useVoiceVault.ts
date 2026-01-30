/**
 * Voice Vault Query Hooks
 *
 * React Query hooks for voice clip management.
 * All data from database - no hardcoding.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  voiceVaultService,
  type VoiceClip,
  type VoiceClipCategoryType,
  type VoiceClipCategoryInfo,
  type VoiceClipFilters,
  type VoiceClipListResponse,
  type CreateVoiceClipInput,
  type UpdateVoiceClipInput,
} from '@/services/voiceVault';
import { handleError } from '@/lib/errors';

/**
 * Get voice clips list
 */
export function useVoiceClips(filters: VoiceClipFilters = {}) {
  return useQuery({
    queryKey: queryKeys.voiceVault.list(filters),
    queryFn: () => voiceVaultService.getClips(filters),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get a single voice clip
 */
export function useVoiceClip(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.voiceVault.detail(id ?? ''),
    queryFn: () => voiceVaultService.getClip(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get voice clip categories
 */
export function useVoiceClipCategories() {
  return useQuery({
    queryKey: queryKeys.voiceVault.categories(),
    queryFn: () => voiceVaultService.getCategories(),
    staleTime: 30 * 60 * 1000, // Categories rarely change
  });
}

/**
 * Create new voice clip
 */
export function useCreateVoiceClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVoiceClipInput) => voiceVaultService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.voiceVault.lists(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateVoiceClip',
        userMessage: 'Failed to save voice clip',
      });
    },
  });
}

/**
 * Update voice clip
 */
export function useUpdateVoiceClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVoiceClipInput }) =>
      voiceVaultService.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.voiceVault.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.voiceVault.detail(data.id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateVoiceClip',
        userMessage: 'Failed to update voice clip',
      });
    },
  });
}

/**
 * Toggle voice clip favorite
 */
export function useToggleVoiceClipFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => voiceVaultService.toggleFavorite(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.voiceVault.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.voiceVault.detail(data.id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useToggleVoiceClipFavorite',
        userMessage: 'Failed to update favorite',
      });
    },
  });
}

/**
 * Record voice clip play
 */
export function useRecordVoiceClipPlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => voiceVaultService.recordPlay(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.voiceVault.detail(id),
      });
    },
  });
}

/**
 * Delete voice clip
 */
export function useDeleteVoiceClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => voiceVaultService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.voiceVault.lists(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteVoiceClip',
        userMessage: 'Failed to delete voice clip',
      });
    },
  });
}

/**
 * Get voice clips suitable for story narration
 * Filters to 'story' category clips
 */
export function useVoiceClipsForNarration(childId?: string) {
  return useQuery({
    queryKey: queryKeys.voiceVault.list({ category: 'story', childId }),
    queryFn: () => voiceVaultService.getClips({ category: 'story', childId }),
    staleTime: 5 * 60 * 1000,
  });
}

// Re-export types
export type {
  VoiceClip,
  VoiceClipCategoryType,
  VoiceClipCategoryInfo,
  VoiceClipFilters,
  VoiceClipListResponse,
  CreateVoiceClipInput,
  UpdateVoiceClipInput,
};
