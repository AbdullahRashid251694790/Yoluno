/**
 * Avatars Service
 *
 * Data access layer for avatar library operations.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import type { AvatarLibraryRow } from '@/types/database';
import type { AvatarLibraryItem, AvatarCategory } from '@/types/domain';
import { handleError } from '@/lib/errors';
import { avatarCache } from './cache/indexedDBCache';

export async function getAllAvatars(): Promise<AvatarLibraryItem[]> {
  const cacheKey = 'all-avatars';
  const cached = await avatarCache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached) as AvatarLibraryItem[];
  }

  try {
    const { data } = await apiClient.get<AvatarLibraryRow[]>('/avatars');

    const avatars = (data ?? []).map(mapRowToAvatar);
    await avatarCache.set(cacheKey, JSON.stringify(avatars));

    return avatars;
  } catch (error) {
    throw handleError(error, {
      context: 'avatars.getAllAvatars',
      strategy: 'throw',
    });
  }
}

export async function getAvatarsByCategory(
  category: AvatarCategory
): Promise<AvatarLibraryItem[]> {
  const cacheKey = `avatars-${category}`;
  const cached = await avatarCache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached) as AvatarLibraryItem[];
  }

  try {
    const { data } = await apiClient.get<AvatarLibraryRow[]>('/avatars', {
      params: { category },
    });

    const avatars = (data ?? []).map(mapRowToAvatar);
    await avatarCache.set(cacheKey, JSON.stringify(avatars));

    return avatars;
  } catch (error) {
    throw handleError(error, {
      context: 'avatars.getAvatarsByCategory',
      strategy: 'throw',
    });
  }
}

export async function getAvatarById(id: string): Promise<AvatarLibraryItem | null> {
  try {
    const { data } = await apiClient.get<AvatarLibraryRow>(`/avatars/${id}`);
    return mapRowToAvatar(data);
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw handleError(error, {
      context: 'avatars.getAvatarById',
      strategy: 'throw',
    });
  }
}

export async function getAvatarUrl(id: string): Promise<string | null> {
  const avatar = await getAvatarById(id);
  return avatar?.imageUrl ?? null;
}

export async function getCategories(): Promise<AvatarCategory[]> {
  try {
    const { data } = await apiClient.get<string[]>('/avatars/categories');
    return (data ?? []) as AvatarCategory[];
  } catch (error) {
    throw handleError(error, {
      context: 'avatars.getCategories',
      strategy: 'throw',
    });
  }
}

export async function searchAvatars(query: string): Promise<AvatarLibraryItem[]> {
  try {
    const { data } = await apiClient.get<AvatarLibraryRow[]>('/avatars', {
      params: { search: query },
    });
    return (data ?? []).map(mapRowToAvatar);
  } catch (error) {
    throw handleError(error, {
      context: 'avatars.searchAvatars',
      strategy: 'throw',
    });
  }
}

export async function clearAvatarCache(): Promise<void> {
  await avatarCache.clear();
}

function mapRowToAvatar(row: AvatarLibraryRow): AvatarLibraryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as AvatarCategory,
    imageUrl: row.image_url,
    thumbnailUrl: row.image_url,
    isAnimated: false,
    isPremium: row.is_premium ?? false,
    tags: row.tags ?? [],
  };
}

export const avatarsService = {
  getAll: getAllAvatars,
  getByCategory: getAvatarsByCategory,
  getById: getAvatarById,
  getUrl: getAvatarUrl,
  getCategories,
  search: searchAvatars,
  clearCache: clearAvatarCache,
};
