/**
 * Journey Rewards Query Hooks
 *
 * React Query hooks for journey reward operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { journeyRewardsService } from '@/services/journeyRewards';
import { handleError } from '@/lib/errors';

/**
 * Get earned rewards for a child
 */
export function useEarnedRewards(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeyRewards.forChild(childId ?? ''),
    queryFn: () => journeyRewardsService.getRewards(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get unviewed rewards for a child
 */
export function useUnviewedRewards(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeyRewards.unviewed(childId ?? ''),
    queryFn: () => journeyRewardsService.getUnviewedRewards(childId!),
    enabled: !!childId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Check for new rewards every minute
  });
}

/**
 * Get reward counts for a child
 */
export function useRewardCount(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeyRewards.count(childId ?? ''),
    queryFn: () => journeyRewardsService.getRewardCount(childId!),
    enabled: !!childId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get all rewards across all children (parent overview)
 */
export function useAllRewards() {
  return useQuery({
    queryKey: queryKeys.journeyRewards.allParent(),
    queryFn: () => journeyRewardsService.getAllRewards(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mark a reward as viewed
 */
export function useMarkRewardViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rewardId,
      childId,
    }: {
      rewardId: string;
      childId: string;
    }) => journeyRewardsService.markRewardViewed(rewardId),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyRewards.forChild(variables.childId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyRewards.unviewed(variables.childId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyRewards.count(variables.childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useMarkRewardViewed',
        userMessage: 'Failed to mark reward as viewed',
      });
    },
  });
}

/**
 * Award a reward (manual trigger)
 */
export function useAwardReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childProfileId,
      journeyId,
    }: {
      childProfileId: string;
      journeyId: string;
    }) => journeyRewardsService.awardReward(childProfileId, journeyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyRewards.forChild(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyRewards.unviewed(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyRewards.count(data.child_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journeyRewards.allParent(),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useAwardReward',
        userMessage: 'Failed to award reward',
      });
    },
  });
}
