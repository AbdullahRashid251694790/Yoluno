/**
 * Journeys Service
 *
 * Data access layer for learning journey operations.
 * Refactored to use generic API wrapper for DRY compliance.
 */

import { apiGet, apiGetOrNull, apiPost, apiPut } from '@/lib/api';
import type {
  JourneyRow,
  JourneyInsert,
  JourneyUpdate,
  JourneyStepRow,
} from '@/types/database';
import type { JourneyWithSteps, JourneyStep } from '@/types/domain';

const CONTEXT = 'journeys';

export async function getActiveJourneys(childId: string): Promise<JourneyWithSteps[]> {
  const journeys = await apiGet<JourneyRow[]>(
    '/journeys',
    `${CONTEXT}.getActiveJourneys`,
    { params: { childId, status: 'active' }, defaultValue: [] }
  );

  const journeysWithSteps = await Promise.all(
    journeys.map(async (journey) => {
      const steps = await apiGet<JourneyStepRow[]>(
        `/journeys/${journey.id}/steps`,
        `${CONTEXT}.getActiveJourneys.steps`,
        { defaultValue: [] }
      );
      return mapJourneyWithSteps({ ...journey, journey_steps: steps });
    })
  );

  return journeysWithSteps;
}

export async function getJourneyById(id: string): Promise<JourneyWithSteps | null> {
  const journey = await apiGetOrNull<JourneyRow>(`/journeys/${id}`, `${CONTEXT}.getJourneyById`);
  if (!journey) return null;

  const steps = await apiGet<JourneyStepRow[]>(
    `/journeys/${id}/steps`,
    `${CONTEXT}.getJourneyById.steps`,
    { defaultValue: [] }
  );

  return mapJourneyWithSteps({ ...journey, journey_steps: steps });
}

export async function createJourney(journey: JourneyInsert): Promise<JourneyRow> {
  return apiPost<JourneyRow>('/journeys', `${CONTEXT}.createJourney`, journey);
}

export async function updateJourney(id: string, updates: JourneyUpdate): Promise<JourneyRow> {
  return apiPut<JourneyRow>(`/journeys/${id}`, `${CONTEXT}.updateJourney`, updates);
}

export async function completeStep(stepId: string, journeyId: string): Promise<JourneyStepRow> {
  return apiPut<JourneyStepRow>(
    `/journeys/${journeyId}/steps/${stepId}`,
    `${CONTEXT}.completeStep`,
    { progress: 100, completed_at: new Date().toISOString() }
  );
}

export async function updateStepProgress(
  stepId: string,
  journeyId: string,
  progress: number
): Promise<JourneyStepRow> {
  return apiPut<JourneyStepRow>(
    `/journeys/${journeyId}/steps/${stepId}`,
    `${CONTEXT}.updateStepProgress`,
    { progress }
  );
}

export async function getCompletedJourneys(childId: string): Promise<JourneyWithSteps[]> {
  const journeys = await apiGet<JourneyRow[]>(
    '/journeys',
    `${CONTEXT}.getCompletedJourneys`,
    { params: { childId, status: 'completed' }, defaultValue: [] }
  );

  const journeysWithSteps = await Promise.all(
    journeys.map(async (journey) => {
      const steps = await apiGet<JourneyStepRow[]>(
        `/journeys/${journey.id}/steps`,
        `${CONTEXT}.getCompletedJourneys.steps`,
        { defaultValue: [] }
      );
      return mapJourneyWithSteps({ ...journey, journey_steps: steps });
    })
  );

  return journeysWithSteps;
}

export async function getJourneyProgress(journeyId: string): Promise<{
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
}> {
  const steps = await apiGet<JourneyStepRow[]>(
    `/journeys/${journeyId}/steps`,
    `${CONTEXT}.getJourneyProgress`,
    { defaultValue: [] }
  );

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.progress === 100).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return { totalSteps, completedSteps, progressPercent };
}

function mapJourneyWithSteps(
  data: JourneyRow & { journey_steps?: JourneyStepRow[] }
): JourneyWithSteps {
  const steps: JourneyStep[] = (data.journey_steps ?? [])
    .sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0))
    .map((step) => ({
      id: step.id,
      title: step.type,
      description: '',
      type: step.type as JourneyStep['type'],
      status: step.progress === 100 ? 'completed' : 'pending' as JourneyStep['status'],
      order: step.step_order ?? 0,
      progress: step.progress ?? 0,
      completedAt: step.completed_at ? new Date(step.completed_at) : undefined,
    }));

  return {
    id: data.id,
    title: data.title,
    description: '',
    status: data.status as JourneyWithSteps['status'],
    templateId: data.template_id ?? undefined,
    childProfileId: data.child_profile_id,
    steps,
    progress: calculateProgress(steps),
    createdAt: new Date(data.created_at),
    completedAt: undefined,
  };
}

function calculateProgress(steps: JourneyStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((s) => s.status === 'completed').length;
  return Math.round((completed / steps.length) * 100);
}

export const journeysService = {
  getActive: getActiveJourneys,
  getById: getJourneyById,
  create: createJourney,
  update: updateJourney,
  completeStep,
  updateStepProgress,
  getCompleted: getCompletedJourneys,
  getProgress: getJourneyProgress,
};
