/**
 * Journeys Service
 *
 * Data access layer for learning journey operations.
 * Refactored to use generic API wrapper for DRY compliance.
 */

import { apiGet, apiGetOrNull, apiPost, apiPut, apiDelete } from '@/lib/api';
import type {
  JourneyRow,
  JourneyInsert,
  JourneyUpdate,
  JourneyStepRow,
} from '@/types/database';
import type { JourneyWithSteps, JourneyStep } from '@/types/domain';

export interface CreateCustomJourneyData {
  child_profile_id: string;
  title: string;
  template_id?: string;
  requires_image_proof?: boolean;
  steps?: Array<{ title: string; description?: string }>;
}

export interface AddStepData {
  title: string;
  description?: string;
  step_order?: number;
}

const CONTEXT = 'journeys';

/**
 * Get all journeys, optionally filtered by child
 */
export async function getAllJourneys(childId?: string): Promise<JourneyWithSteps[]> {
  const params: Record<string, string> = {};
  if (childId) params.childId = childId;

  const journeys = await apiGet<JourneyRow[]>(
    '/journeys',
    `${CONTEXT}.getAllJourneys`,
    { params, defaultValue: [] }
  );

  const journeysWithSteps = await Promise.all(
    journeys.map(async (journey) => {
      const steps = await apiGet<JourneyStepRow[]>(
        `/journeys/${journey.id}/steps`,
        `${CONTEXT}.getAllJourneys.steps`,
        { defaultValue: [] }
      );
      return mapJourneyWithSteps({ ...journey, journey_steps: steps });
    })
  );

  return journeysWithSteps;
}

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
  const sortedSteps = (data.journey_steps ?? [])
    .sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));

  const steps: JourneyStep[] = sortedSteps.map((step, index) => ({
    id: step.id,
    journeyId: step.journey_id,
    stepNumber: step.step_order ?? index + 1,
    title: step.title || step.type || `Step ${index + 1}`,
    description: step.description || null,
    isCompleted: step.progress === 100,
    completedAt: step.completed_at,
  }));

  const completedSteps = steps.filter((s) => s.isCompleted).length;

  return {
    id: data.id,
    title: data.title,
    description: (data as any).template_description || null,
    status: data.status as JourneyWithSteps['status'],
    templateId: data.template_id ?? undefined,
    childProfileId: data.child_profile_id,
    currentStep: completedSteps,
    totalSteps: steps.length,
    steps,
    progress: calculateProgress(steps),
    createdAt: new Date(data.created_at),
    completedAt: data.completed_at,
  };
}

function calculateProgress(steps: JourneyStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((s) => s.isCompleted).length;
  return Math.round((completed / steps.length) * 100);
}

/**
 * Delete a journey
 */
export async function deleteJourney(id: string): Promise<void> {
  return apiDelete(`/journeys/${id}`, `${CONTEXT}.deleteJourney`);
}

/**
 * Create a custom journey with steps
 */
export async function createCustomJourney(data: CreateCustomJourneyData): Promise<JourneyWithSteps> {
  const response = await apiPost<JourneyRow & { steps: JourneyStepRow[] }>(
    '/journeys/custom',
    `${CONTEXT}.createCustomJourney`,
    data
  );
  return mapJourneyWithSteps({ ...response, journey_steps: response.steps });
}

/**
 * Add a step to a journey
 */
export async function addJourneyStep(journeyId: string, step: AddStepData): Promise<JourneyStepRow> {
  return apiPost<JourneyStepRow>(
    `/journeys/${journeyId}/steps`,
    `${CONTEXT}.addJourneyStep`,
    step
  );
}

/**
 * Remove a step from a journey
 */
export async function removeJourneyStep(journeyId: string, stepId: string): Promise<void> {
  return apiDelete(
    `/journeys/${journeyId}/steps/${stepId}`,
    `${CONTEXT}.removeJourneyStep`
  );
}

/**
 * Reorder steps in a journey
 */
export async function reorderJourneySteps(journeyId: string, stepIds: string[]): Promise<JourneyStepRow[]> {
  return apiPut<JourneyStepRow[]>(
    `/journeys/${journeyId}/steps/reorder`,
    `${CONTEXT}.reorderJourneySteps`,
    { stepIds }
  );
}

export const journeysService = {
  getAll: getAllJourneys,
  getActive: getActiveJourneys,
  getById: getJourneyById,
  create: createJourney,
  update: updateJourney,
  delete: deleteJourney,
  completeStep,
  updateStepProgress,
  getCompleted: getCompletedJourneys,
  getProgress: getJourneyProgress,
  createCustom: createCustomJourney,
  addStep: addJourneyStep,
  removeStep: removeJourneyStep,
  reorderSteps: reorderJourneySteps,
};
