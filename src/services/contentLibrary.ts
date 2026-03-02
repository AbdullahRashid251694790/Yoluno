/**
 * Content Library Service
 *
 * Data access layer for saved content management.
 * All data from database - no hardcoding.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

const CONTEXT = 'contentLibrary';

// Types
export type ContentType = 'story' | 'chat_snippet' | 'journey' | 'note' | 'voice';

export interface ContentItem {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  content_type: ContentType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  is_favorite: boolean;
  created_at: string;
  child_name?: string | null;
}

export interface ContentListResponse {
  items: ContentItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ContentFilters {
  childId?: string;
  type?: ContentType;
  favorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateContentInput {
  child_profile_id?: string;
  content_type: ContentType;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateContentInput {
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  is_favorite?: boolean;
}

/**
 * Get saved content list
 */
export async function getContentItems(
  filters: ContentFilters = {}
): Promise<ContentListResponse> {
  const params: Record<string, string> = {};
  if (filters.childId) params.childId = filters.childId;
  if (filters.type) params.type = filters.type;
  if (filters.favorite) params.favorite = 'true';
  if (filters.limit) params.limit = filters.limit.toString();
  if (filters.offset) params.offset = filters.offset.toString();

  return apiGet<ContentListResponse>(
    '/content-library',
    `${CONTEXT}.getContentItems`,
    { params }
  );
}

/**
 * Get a single content item
 */
export async function getContentItem(id: string): Promise<ContentItem> {
  return apiGet<ContentItem>(
    `/content-library/${id}`,
    `${CONTEXT}.getContentItem`
  );
}

/**
 * Save new content
 */
export async function createContent(input: CreateContentInput): Promise<ContentItem> {
  return apiPost<ContentItem>(
    '/content-library',
    `${CONTEXT}.createContent`,
    input
  );
}

/**
 * Update content item
 */
export async function updateContent(
  id: string,
  input: UpdateContentInput
): Promise<ContentItem> {
  return apiPut<ContentItem>(
    `/content-library/${id}`,
    `${CONTEXT}.updateContent`,
    input
  );
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(id: string): Promise<ContentItem> {
  return apiPut<ContentItem>(
    `/content-library/${id}/favorite`,
    `${CONTEXT}.toggleFavorite`,
    {}
  );
}

/**
 * Delete content item
 */
export async function deleteContent(id: string): Promise<void> {
  return apiDelete(
    `/content-library/${id}`,
    `${CONTEXT}.deleteContent`
  );
}

export const contentLibraryService = {
  getItems: getContentItems,
  getItem: getContentItem,
  create: createContent,
  update: updateContent,
  toggleFavorite,
  delete: deleteContent,
};
