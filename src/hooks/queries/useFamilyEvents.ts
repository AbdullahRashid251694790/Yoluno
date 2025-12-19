/**
 * Family Events Query Hooks
 *
 * React Query hooks for family events, photos, and export.
 * All data from database - no hardcoding.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  familyEventsService,
  type FamilyEvent,
  type FamilyPhoto,
  type EventType,
  type EventTypeInfo,
  type ExportConfig,
  type EventFilters,
  type PhotoFilters,
  type EventListResponse,
  type PhotoListResponse,
  type CreateEventInput,
  type UpdateEventInput,
  type CreatePhotoInput,
  type UpdatePhotoInput,
  type ExportData,
} from '@/services/familyEvents';
import { handleError } from '@/lib/errors';

// === EVENT HOOKS ===

/**
 * Get family events list
 */
export function useFamilyEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: queryKeys.familyEvents.eventList(filters),
    queryFn: () => familyEventsService.getEvents(filters),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get a single family event
 */
export function useFamilyEvent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.familyEvents.eventDetail(id ?? ''),
    queryFn: () => familyEventsService.getEvent(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get event types
 */
export function useEventTypes() {
  return useQuery({
    queryKey: queryKeys.familyEvents.eventTypes(),
    queryFn: () => familyEventsService.getEventTypes(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Create family event
 */
export function useCreateFamilyEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => familyEventsService.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.events(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.timeline(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateFamilyEvent',
        userMessage: 'Failed to create event',
      });
    },
  });
}

/**
 * Update family event
 */
export function useUpdateFamilyEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      familyEventsService.updateEvent(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.events(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.eventDetail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.timeline(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateFamilyEvent',
        userMessage: 'Failed to update event',
      });
    },
  });
}

/**
 * Delete family event
 */
export function useDeleteFamilyEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familyEventsService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.events(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.timeline(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteFamilyEvent',
        userMessage: 'Failed to delete event',
      });
    },
  });
}

// === PHOTO HOOKS ===

/**
 * Get family photos list
 */
export function useFamilyPhotos(filters: PhotoFilters = {}) {
  return useQuery({
    queryKey: queryKeys.familyEvents.photoList(filters),
    queryFn: () => familyEventsService.getPhotos(filters),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create family photo
 */
export function useCreateFamilyPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePhotoInput) => familyEventsService.createPhoto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.photos(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateFamilyPhoto',
        userMessage: 'Failed to upload photo',
      });
    },
  });
}

/**
 * Update family photo
 */
export function useUpdateFamilyPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePhotoInput }) =>
      familyEventsService.updatePhoto(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.photos(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateFamilyPhoto',
        userMessage: 'Failed to update photo',
      });
    },
  });
}

/**
 * Toggle photo favorite
 */
export function useToggleFamilyPhotoFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familyEventsService.togglePhotoFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.photos(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useToggleFamilyPhotoFavorite',
        userMessage: 'Failed to update favorite',
      });
    },
  });
}

/**
 * Delete family photo
 */
export function useDeleteFamilyPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familyEventsService.deletePhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyEvents.photos(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteFamilyPhoto',
        userMessage: 'Failed to delete photo',
      });
    },
  });
}

// === TIMELINE HOOKS ===

/**
 * Get family timeline
 */
export function useFamilyTimeline(limit: number = 50) {
  return useQuery({
    queryKey: queryKeys.familyEvents.timeline(limit),
    queryFn: () => familyEventsService.getTimeline(limit),
    staleTime: 2 * 60 * 1000,
  });
}

// === EXPORT HOOKS ===

/**
 * Get export configurations
 */
export function useExportConfigs() {
  return useQuery({
    queryKey: queryKeys.familyEvents.exportConfigs(),
    queryFn: () => familyEventsService.getExportConfigs(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Export family data
 */
export function useExportFamilyData() {
  return useMutation({
    mutationFn: (format: string) => familyEventsService.exportData(format),
    onError: (error) => {
      handleError(error, {
        context: 'useExportFamilyData',
        userMessage: 'Failed to export data',
      });
    },
  });
}

// Re-export types
export type {
  FamilyEvent,
  FamilyPhoto,
  EventType,
  EventTypeInfo,
  ExportConfig,
  EventFilters,
  PhotoFilters,
  EventListResponse,
  PhotoListResponse,
  CreateEventInput,
  UpdateEventInput,
  CreatePhotoInput,
  UpdatePhotoInput,
  ExportData,
};
