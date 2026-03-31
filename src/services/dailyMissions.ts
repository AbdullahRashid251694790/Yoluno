/**
 * Daily Missions Service
 */

import { apiGet, apiPost } from '@/lib/api';

export interface DailyMission {
  type: string;
  title: string;
  emoji: string;
  completed: boolean;
}

export interface DailyMissionsResponse {
  id: string;
  date: string;
  missions: DailyMission[];
  allCompleted: boolean;
  bonusAwarded: boolean;
}

export interface ClaimResponse {
  message: string;
  points: number;
  allCompleted: boolean;
}

const CONTEXT = 'dailyMissions';

export async function getDailyMissions(childId: string): Promise<DailyMissionsResponse> {
  return apiGet<DailyMissionsResponse>(
    `/daily-missions/${childId}`,
    `${CONTEXT}.getDailyMissions`
  );
}

export async function claimMissionBonus(childId: string): Promise<ClaimResponse> {
  return apiPost<ClaimResponse>(
    `/daily-missions/${childId}/claim`,
    `${CONTEXT}.claimMissionBonus`,
    {}
  );
}

export const dailyMissionsService = {
  get: getDailyMissions,
  claim: claimMissionBonus,
};
