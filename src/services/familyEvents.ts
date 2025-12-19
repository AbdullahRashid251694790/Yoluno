/**
 * Family Events Service
 *
 * Family events, photos, and export functionality.
 * All data from database - no hardcoding.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

const CONTEXT = 'familyEvents';

// Types
export type EventType = 'birth' | 'death' | 'marriage' | 'graduation' | 'achievement' | 'holiday' | 'reunion' | 'milestone' | 'other';

export interface FamilyEvent {
  id: string;
  user_id: string;
  family_member_id: string | null;
  event_type: EventType;
  title: string;
  description: string | null;
  event_date: string | null;
  event_year: number | null;
  location: string | null;
  photos: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
  family_member_name?: string | null;
}

export interface FamilyPhoto {
  id: string;
  user_id: string;
  family_member_id: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  photo_date: string | null;
  location: string | null;
  tags: string[];
  is_favorite: boolean;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
  family_member_name?: string | null;
}

export interface EventTypeInfo {
  key: string;
  label: string;
  icon: string;
}

export interface ExportConfig {
  id: string;
  format: string;
  label: string;
  description: string | null;
  mime_type: string;
  file_extension: string;
  is_enabled: boolean;
  is_premium: boolean;
}

export interface EventFilters {
  familyMemberId?: string;
  eventType?: EventType;
  year?: number;
  limit?: number;
  offset?: number;
}

export interface PhotoFilters {
  familyMemberId?: string;
  favorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface EventListResponse {
  items: FamilyEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface PhotoListResponse {
  items: FamilyPhoto[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateEventInput {
  family_member_id?: string;
  event_type: EventType;
  title: string;
  description?: string;
  event_date?: string;
  event_year?: number;
  location?: string;
  photos?: string[];
  is_private?: boolean;
}

export interface UpdateEventInput {
  family_member_id?: string | null;
  event_type?: EventType;
  title?: string;
  description?: string | null;
  event_date?: string | null;
  event_year?: number | null;
  location?: string | null;
  photos?: string[];
  is_private?: boolean;
}

export interface CreatePhotoInput {
  family_member_id?: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  photo_date?: string;
  location?: string;
  tags?: string[];
  width?: number;
  height?: number;
  file_size_bytes?: number;
}

export interface UpdatePhotoInput {
  caption?: string | null;
  photo_date?: string | null;
  location?: string | null;
  tags?: string[];
  is_favorite?: boolean;
}

export interface ExportData {
  exported_at: string;
  family_members: unknown[];
  events: unknown[];
  photos: unknown[];
}

// Events API

async function getEvents(filters: EventFilters = {}): Promise<EventListResponse> {
  const params = new URLSearchParams();
  if (filters.familyMemberId) params.append('familyMemberId', filters.familyMemberId);
  if (filters.eventType) params.append('eventType', filters.eventType);
  if (filters.year) params.append('year', filters.year.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const url = `/family-events/events${queryString ? `?${queryString}` : ''}`;
  return apiGet<EventListResponse>(url, `${CONTEXT}.getEvents`);
}

async function getEvent(id: string): Promise<FamilyEvent> {
  return apiGet<FamilyEvent>(`/family-events/events/${id}`, `${CONTEXT}.getEvent`);
}

async function getEventTypes(): Promise<EventTypeInfo[]> {
  return apiGet<EventTypeInfo[]>('/family-events/event-types', `${CONTEXT}.getEventTypes`);
}

async function createEvent(input: CreateEventInput): Promise<FamilyEvent> {
  return apiPost<FamilyEvent>('/family-events/events', `${CONTEXT}.createEvent`, input);
}

async function updateEvent(id: string, input: UpdateEventInput): Promise<FamilyEvent> {
  return apiPut<FamilyEvent>(`/family-events/events/${id}`, `${CONTEXT}.updateEvent`, input);
}

async function deleteEvent(id: string): Promise<void> {
  await apiDelete(`/family-events/events/${id}`, `${CONTEXT}.deleteEvent`);
}

// Photos API

async function getPhotos(filters: PhotoFilters = {}): Promise<PhotoListResponse> {
  const params = new URLSearchParams();
  if (filters.familyMemberId) params.append('familyMemberId', filters.familyMemberId);
  if (filters.favorite) params.append('favorite', 'true');
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const url = `/family-events/photos${queryString ? `?${queryString}` : ''}`;
  return apiGet<PhotoListResponse>(url, `${CONTEXT}.getPhotos`);
}

async function createPhoto(input: CreatePhotoInput): Promise<FamilyPhoto> {
  return apiPost<FamilyPhoto>('/family-events/photos', `${CONTEXT}.createPhoto`, input);
}

async function updatePhoto(id: string, input: UpdatePhotoInput): Promise<FamilyPhoto> {
  return apiPut<FamilyPhoto>(`/family-events/photos/${id}`, `${CONTEXT}.updatePhoto`, input);
}

async function togglePhotoFavorite(id: string): Promise<FamilyPhoto> {
  return apiPut<FamilyPhoto>(`/family-events/photos/${id}/favorite`, `${CONTEXT}.togglePhotoFavorite`, {});
}

async function deletePhoto(id: string): Promise<void> {
  await apiDelete(`/family-events/photos/${id}`, `${CONTEXT}.deletePhoto`);
}

// Timeline API

async function getTimeline(limit: number = 50): Promise<FamilyEvent[]> {
  return apiGet<FamilyEvent[]>(`/family-events/timeline?limit=${limit}`, `${CONTEXT}.getTimeline`);
}

// Export API

async function getExportConfigs(): Promise<ExportConfig[]> {
  return apiGet<ExportConfig[]>('/family-events/export/configs', `${CONTEXT}.getExportConfigs`);
}

async function exportData(format: string = 'json'): Promise<ExportData> {
  return apiPost<ExportData>('/family-events/export', `${CONTEXT}.exportData`, { format });
}

export const familyEventsService = {
  // Events
  getEvents,
  getEvent,
  getEventTypes,
  createEvent,
  updateEvent,
  deleteEvent,
  // Photos
  getPhotos,
  createPhoto,
  updatePhoto,
  togglePhotoFavorite,
  deletePhoto,
  // Timeline
  getTimeline,
  // Export
  getExportConfigs,
  exportData,
};
