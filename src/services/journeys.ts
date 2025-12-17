/**
 * Journeys Service
 *
 * Data access layer for learning journey operations.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import type {
  JourneyRow,
  JourneyInsert,
  JourneyUpdate,
  JourneyStepRow,
} from '@/types/database';
import type { JourneyWithSteps, JourneyStep } from '@/types/domain';
import { handleError } from '@/lib/errors';

export async function getActiveJourneys(childId: string): Promise<JourneyWithSteps[]> {
  try {
    const { data } = await apiClient.get<JourneyRow[]>('/journeys', {
      params: { childId, status: 'active' },
    });

    // Fetch steps for each journey
    const journeysWithSteps = await Promise.all(
      (data ?? []).map(async (journey) => {
        const { data: steps } = await apiClient.get<JourneyStepRow[]>(`/journeys/${journey.id}/steps`);
        return mapJourneyWithSteps({ ...journey, journey_steps: steps });
      })
    );

    return journeysWithSteps;
  } catch (error) {
    throw handleError(error, {
      context: 'journeys.getActiveJourneys',
      strategy: 'throw',
    });
  }
}

export async function getJourneyById(id: string): Promise<JourneyWithSteps | null> {
  try {
    const { data: journey } = await apiClient.get<JourneyRow>(`/journeys/${id}`);
    const { data: steps } = await apiClient.get<JourneyStepRow[]>(`/journeys/${id}/steps`);

    return mapJourneyWithSteps({ ...journey, journey_steps: steps });
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw handleError(error, {
      context: 'journeys.getJourneyById',
      strategy: 'throw',
    });
  }
}

export async function createJourney(journey: JourneyInsert): Promise<JourneyRow> {
  try {
    const { data } = await apiClient.post<JourneyRow>('/journeys', journey);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'journeys.createJourney',
      strategy: 'throw',
    });
  }
}

export async function updateJourney(
  id: string,
  updates: JourneyUpdate
): Promise<JourneyRow> {
  try {
    const { data } = await apiClient.put<JourneyRow>(`/journeys/${id}`, updates);
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'journeys.updateJourney',
      strategy: 'throw',
    });
  }
}

export async function completeStep(stepId: string, journeyId: string): Promise<JourneyStepRow> {
  try {
    const { data } = await apiClient.put<JourneyStepRow>(
      `/journeys/${journeyId}/steps/${stepId}`,
      {
        progress: 100,
        completed_at: new Date().toISOString(),
      }
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'journeys.completeStep',
      strategy: 'throw',
    });
  }
}

export async function updateStepProgress(
  stepId: string,
  journeyId: string,
  progress: number
): Promise<JourneyStepRow> {
  try {
    const { data } = await apiClient.put<JourneyStepRow>(
      `/journeys/${journeyId}/steps/${stepId}`,
      { progress }
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'journeys.updateStepProgress',
      strategy: 'throw',
    });
  }
}

export async function getCompletedJourneys(childId: string): Promise<JourneyWithSteps[]> {
  try {
    const { data } = await apiClient.get<JourneyRow[]>('/journeys', {
      params: { childId, status: 'completed' },
    });

    const journeysWithSteps = await Promise.all(
      (data ?? []).map(async (journey) => {
        const { data: steps } = await apiClient.get<JourneyStepRow[]>(`/journeys/${journey.id}/steps`);
        return mapJourneyWithSteps({ ...journey, journey_steps: steps });
      })
    );

    return journeysWithSteps;
  } catch (error) {
    throw handleError(error, {
      context: 'journeys.getCompletedJourneys',
      strategy: 'throw',
    });
  }
}

export async function getJourneyProgress(journeyId: string): Promise<{
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
}> {
  try {
    const { data: steps } = await apiClient.get<JourneyStepRow[]>(`/journeys/${journeyId}/steps`);

    const totalSteps = steps?.length ?? 0;
    const completedSteps = (steps ?? []).filter((s) => s.progress === 100).length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return { totalSteps, completedSteps, progressPercent };
  } catch (error) {
    throw handleError(error, {
      context: 'journeys.getJourneyProgress',
      strategy: 'throw',
    });
  }
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
