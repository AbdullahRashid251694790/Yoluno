/**
 * Daily Missions Query Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyMissionsService, type DailyMissionsResponse, type ClaimResponse } from '@/services/dailyMissions';

const DAILY_MISSIONS_KEY = ['daily-missions'] as const;

export function useDailyMissions(childId: string | undefined) {
  return useQuery({
    queryKey: [...DAILY_MISSIONS_KEY, childId],
    queryFn: () => dailyMissionsService.get(childId!),
    enabled: !!childId,
    staleTime: 10 * 1000, // 10 seconds — short so returning to home refetches
    refetchOnWindowFocus: true, // Override global setting — refetch when tab regains focus
  });
}

export function useClaimMissionBonus() {
  const queryClient = useQueryClient();

  return useMutation<ClaimResponse, Error, string>({
    mutationFn: (childId: string) => dailyMissionsService.claim(childId),
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({ queryKey: [...DAILY_MISSIONS_KEY, childId] });
      // Also refresh gamification stats since points changed
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}
