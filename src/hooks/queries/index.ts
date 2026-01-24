/**
 * Query Hooks Index
 *
 * Barrel export for all React Query hooks.
 */

// Query keys
export { queryKeys } from './keys';

// Child profiles
export {
  useChildProfiles,
  useChildProfile,
  useCreateChildProfile,
  useUpdateChildProfile,
  useDeleteChildProfile,
  useUpdateChildAvatar,
  usePrefetchChildProfile,
} from './useChildProfiles';

// Stories
export {
  useStoriesByChild,
  useStory,
  useFavoriteStories,
  useRecentStories,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
  useToggleFavorite,
} from './useStories';

// Family
export {
  useFamilyMembers,
  useFamilyMember,
  useFamilyRelationships,
  useFamilyTree,
  useCreateFamilyMember,
  useUpdateFamilyMember,
  useDeleteFamilyMember,
  useCreateRelationship,
  useDeleteRelationship,
} from './useFamily';

// Journeys
export {
  useActiveJourneys,
  useCompletedJourneys,
  useJourney,
  useJourneyProgress,
  useCreateJourney,
  useUpdateJourney,
  useCompleteStep,
  useUpdateStepProgress,
} from './useJourneys';

// Guardrails
export {
  useGuardrailSettings,
  useUpdateGuardrailSettings,
  useResetGuardrailSettings,
  useAddBlockedTopic,
  useRemoveBlockedTopic,
} from './useGuardrails';

// Avatars
export {
  useAllAvatars,
  useAvatarsByCategory,
  useAvatar,
  useAvatarCategories,
  useSearchAvatars,
  usePrefetchAvatarCategory,
  useClearAvatarCache,
} from './useAvatars';

// Notifications
export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useRequestPasswordChange,
  useAddNotificationToCache,
} from './useNotifications';
