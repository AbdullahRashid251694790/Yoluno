/**
 * Shared Moments Service
 *
 * Data access for child-initiated shared moments (journey completions,
 * story creations, story reads) that surface on the parent dashboard.
 */

import { apiGet, apiPost } from '@/lib/api';
import { apiClient } from '@/integrations/api/client';

const CONTEXT = 'sharedMoments';

export type SharedMomentType = 'journey_complete' | 'story_created' | 'story_read';

export interface SharedMoment {
  id: string;
  child_profile_id: string;
  user_id: string;
  moment_type: SharedMomentType;
  title: string;
  context: string | null;
  reflection: string | null;
  reference_id: string | null;
  is_seen: boolean;
  shared_at: string;
  child_name: string;
}

export interface CreateSharedMomentInput {
  child_profile_id: string;
  moment_type: SharedMomentType;
  title: string;
  context?: string;
  reflection?: string;
  reference_id?: string;
}

export async function listSharedMoments(): Promise<SharedMoment[]> {
  return apiGet<SharedMoment[]>(
    '/shared-moments',
    `${CONTEXT}.list`,
    { defaultValue: [] }
  );
}

/**
 * List every shared moment for a single child (seen and unseen). Used by
 * the Insights → Moments tab.
 */
export async function listChildSharedMoments(childId: string): Promise<SharedMoment[]> {
  return apiGet<SharedMoment[]>(
    '/shared-moments',
    `${CONTEXT}.listForChild`,
    {
      defaultValue: [],
      params: { childId, include_seen: 'true' },
    }
  );
}

export async function createSharedMoment(
  input: CreateSharedMomentInput
): Promise<SharedMoment> {
  return apiPost<SharedMoment>(
    '/shared-moments',
    `${CONTEXT}.create`,
    input
  );
}

export async function markSharedMomentSeen(id: string): Promise<void> {
  await apiClient.patch(`/shared-moments/${id}/seen`);
}

export const sharedMomentsService = {
  listSharedMoments,
  listChildSharedMoments,
  createSharedMoment,
  markSharedMomentSeen,
};
