/**
 * Onboarding Service
 *
 * Child onboarding progress management.
 * All data from database - no hardcoding.
 */

import { apiGet, apiPost, apiPut } from '@/lib/api';

const CONTEXT = 'onboarding';

// Types
export interface OnboardingProgress {
  id: string;
  child_profile_id: string;
  completed_at: string | null;
  current_step: string | null;
  steps_completed: string[];
  skipped: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStatus {
  completed: boolean;
  skipped: boolean;
  needs_onboarding: boolean;
}

export interface UpdateStepInput {
  current_step: string;
  step_completed?: string;
}

// API Functions

async function getProgress(childId: string): Promise<OnboardingProgress> {
  return apiGet<OnboardingProgress>(`/onboarding/${childId}`, `${CONTEXT}.getProgress`);
}

async function getStatus(childId: string): Promise<OnboardingStatus> {
  return apiGet<OnboardingStatus>(`/onboarding/${childId}/status`, `${CONTEXT}.getStatus`);
}

async function updateStep(childId: string, input: UpdateStepInput): Promise<OnboardingProgress> {
  return apiPut<OnboardingProgress>(`/onboarding/${childId}/step`, `${CONTEXT}.updateStep`, input);
}

async function complete(childId: string, skipped: boolean = false): Promise<OnboardingProgress> {
  return apiPost<OnboardingProgress>(`/onboarding/${childId}/complete`, `${CONTEXT}.complete`, { skipped });
}

async function reset(childId: string): Promise<OnboardingProgress> {
  return apiPost<OnboardingProgress>(`/onboarding/${childId}/reset`, `${CONTEXT}.reset`, {});
}

export const onboardingService = {
  getProgress,
  getStatus,
  updateStep,
  complete,
  reset,
};
