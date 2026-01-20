/**
 * Journey Rewards Service
 *
 * Data access layer for journey reward operations.
 */

import { apiGet, apiPut, apiPost } from '@/lib/api';

const CONTEXT = 'journeyRewards';

export interface JourneyReward {
  id: string;
  child_profile_id: string;
  journey_id: string;
  reward_image_url: string;
  reward_title: string;
  earned_at: string;
  viewed: boolean;
  journey_title?: string;
  child_name?: string;
}

export interface RewardCount {
  total: number;
  unviewed: number;
}

/**
 * Get all earned rewards for a child
 */
export async function getRewards(childId: string): Promise<JourneyReward[]> {
  return apiGet<JourneyReward[]>(
    `/journey-rewards/${childId}`,
    `${CONTEXT}.getRewards`,
    { defaultValue: [] }
  );
}

/**
 * Get unviewed rewards for a child
 */
export async function getUnviewedRewards(childId: string): Promise<JourneyReward[]> {
  return apiGet<JourneyReward[]>(
    `/journey-rewards/${childId}/unviewed`,
    `${CONTEXT}.getUnviewedRewards`,
    { defaultValue: [] }
  );
}

/**
 * Get reward counts for a child
 */
export async function getRewardCount(childId: string): Promise<RewardCount> {
  return apiGet<RewardCount>(
    `/journey-rewards/${childId}/count`,
    `${CONTEXT}.getRewardCount`,
    { defaultValue: { total: 0, unviewed: 0 } }
  );
}

/**
 * Mark a reward as viewed
 */
export async function markRewardViewed(rewardId: string): Promise<void> {
  return apiPut(`/journey-rewards/${rewardId}/viewed`, `${CONTEXT}.markRewardViewed`);
}

/**
 * Get all rewards across all children (parent overview)
 */
export async function getAllRewards(): Promise<JourneyReward[]> {
  return apiGet<JourneyReward[]>(
    '/journey-rewards/',
    `${CONTEXT}.getAllRewards`,
    { defaultValue: [] }
  );
}

/**
 * Award a reward (used internally when journey completes)
 */
export async function awardReward(
  childProfileId: string,
  journeyId: string
): Promise<JourneyReward> {
  return apiPost<JourneyReward>(
    '/journey-rewards/award',
    `${CONTEXT}.awardReward`,
    { child_profile_id: childProfileId, journey_id: journeyId }
  );
}

export const journeyRewardsService = {
  getRewards,
  getUnviewedRewards,
  getRewardCount,
  markRewardViewed,
  getAllRewards,
  awardReward,
};
