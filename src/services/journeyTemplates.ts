/**
 * Journey Templates Service
 *
 * Data access layer for journey template operations.
 * All templates come from database - no hardcoding.
 */

import { apiGet, apiPost } from '@/lib/api';

// Types matching backend
export interface JourneyTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  age_range_min: number;
  age_range_max: number;
  duration_days: number;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  icon: string | null;
  is_featured: boolean;
  usage_count: number;
  created_at: string;
}

export interface JourneyTemplateStep {
  id: string;
  template_id: string;
  step_order: number;
  title: string;
  description: string | null;
  type: 'activity' | 'reflection' | 'milestone' | null;
  content: Record<string, unknown>;
}

export interface JourneyTemplateWithSteps extends JourneyTemplate {
  steps: JourneyTemplateStep[];
}

export interface TemplateCategory {
  category: string;
  count: number;
}

export interface TemplateFilters {
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  minAge?: number;
  maxAge?: number;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface Journey {
  id: string;
  child_profile_id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  created_at: string;
  updated_at: string;
}

const CONTEXT = 'journeyTemplates';

/**
 * Get all journey templates with optional filters
 */
export async function getJourneyTemplates(
  filters?: TemplateFilters
): Promise<JourneyTemplate[]> {
  const params = filters ? { ...filters } : undefined;
  return apiGet<JourneyTemplate[]>(
    '/journey-templates',
    `${CONTEXT}.getJourneyTemplates`,
    { params, defaultValue: [] }
  );
}

/**
 * Get all template categories
 */
export async function getTemplateCategories(): Promise<TemplateCategory[]> {
  return apiGet<TemplateCategory[]>(
    '/journey-templates/categories',
    `${CONTEXT}.getTemplateCategories`,
    { defaultValue: [] }
  );
}

/**
 * Get featured templates
 */
export async function getFeaturedTemplates(limit = 6): Promise<JourneyTemplate[]> {
  return apiGet<JourneyTemplate[]>(
    '/journey-templates/featured',
    `${CONTEXT}.getFeaturedTemplates`,
    { params: { limit }, defaultValue: [] }
  );
}

/**
 * Get a single template with its steps
 */
export async function getTemplateById(id: string): Promise<JourneyTemplateWithSteps | null> {
  try {
    return await apiGet<JourneyTemplateWithSteps>(
      `/journey-templates/${id}`,
      `${CONTEXT}.getTemplateById`
    );
  } catch {
    return null;
  }
}

/**
 * Get templates appropriate for a child's age
 */
export async function getTemplatesForChild(childId: string): Promise<JourneyTemplate[]> {
  return apiGet<JourneyTemplate[]>(
    `/journey-templates/for-child/${childId}`,
    `${CONTEXT}.getTemplatesForChild`,
    { defaultValue: [] }
  );
}

/**
 * Start a journey from a template
 */
export async function startJourneyFromTemplate(
  templateId: string,
  childId: string
): Promise<Journey> {
  return apiPost<Journey>(
    `/journey-templates/${templateId}/start`,
    `${CONTEXT}.startJourneyFromTemplate`,
    { childId }
  );
}

export const journeyTemplatesService = {
  getAll: getJourneyTemplates,
  getCategories: getTemplateCategories,
  getFeatured: getFeaturedTemplates,
  getById: getTemplateById,
  getForChild: getTemplatesForChild,
  startFromTemplate: startJourneyFromTemplate,
};
