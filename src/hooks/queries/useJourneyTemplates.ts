/**
 * Journey Templates Query Hooks
 *
 * React Query hooks for journey template operations.
 * All templates come from database - no hardcoding.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createMutationHook } from './useMutationFactory';
import {
  journeyTemplatesService,
  type JourneyTemplate,
  type JourneyTemplateWithSteps,
  type TemplateCategory,
  type TemplateFilters,
  type Journey,
} from '@/services/journeyTemplates';

// ============================================================
// Query Hooks
// ============================================================

/**
 * Get all journey templates with optional filters
 */
export function useJourneyTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: queryKeys.journeyTemplates.list(filters),
    queryFn: () => journeyTemplatesService.getAll(filters),
    staleTime: 5 * 60 * 1000, // Templates don't change often
  });
}

/**
 * Get all template categories
 */
export function useTemplateCategories() {
  return useQuery({
    queryKey: queryKeys.journeyTemplates.categories(),
    queryFn: journeyTemplatesService.getCategories,
    staleTime: 10 * 60 * 1000, // Categories change rarely
  });
}

/**
 * Get featured templates
 */
export function useFeaturedTemplates(limit = 6) {
  return useQuery({
    queryKey: [...queryKeys.journeyTemplates.featured(), limit],
    queryFn: () => journeyTemplatesService.getFeatured(limit),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get a single template with its steps
 */
export function useJourneyTemplate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeyTemplates.detail(id ?? ''),
    queryFn: () => journeyTemplatesService.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get templates appropriate for a child's age
 */
export function useTemplatesForChild(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.journeyTemplates.forChild(childId ?? ''),
    queryFn: () => journeyTemplatesService.getForChild(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Mutation Hooks
// ============================================================

interface StartJourneyVariables {
  templateId: string;
  childId: string;
}

/**
 * Start a journey from a template
 */
export const useStartJourneyFromTemplate = createMutationHook<Journey, StartJourneyVariables>({
  mutationFn: ({ templateId, childId }) =>
    journeyTemplatesService.startFromTemplate(templateId, childId),
  context: 'useStartJourneyFromTemplate',
  userMessage: 'Failed to start journey',
  invalidateKeys: (data, { childId }) => [
    queryKeys.journeys.lists(),
    queryKeys.journeys.active(childId),
    queryKeys.journeyTemplates.all,
  ],
});

// ============================================================
// Convenience Exports
// ============================================================

export type {
  JourneyTemplate,
  JourneyTemplateWithSteps,
  TemplateCategory,
  TemplateFilters,
  Journey,
};
