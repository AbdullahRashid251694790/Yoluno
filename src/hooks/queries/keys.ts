/**
 * Query Keys Factory
 *
 * Centralized query key definitions for React Query.
 */

export const queryKeys = {
  // Child Profiles
  childProfiles: {
    all: ['child-profiles'] as const,
    lists: () => [...queryKeys.childProfiles.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.childProfiles.lists(), userId] as const,
    details: () => [...queryKeys.childProfiles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.childProfiles.details(), id] as const,
  },

  // Stories
  stories: {
    all: ['stories'] as const,
    lists: () => [...queryKeys.stories.all, 'list'] as const,
    listByChild: (childId: string) => [...queryKeys.stories.lists(), 'child', childId] as const,
    favorites: (childId: string) => [...queryKeys.stories.lists(), 'favorites', childId] as const,
    recent: (userId: string) => [...queryKeys.stories.lists(), 'recent', userId] as const,
    details: () => [...queryKeys.stories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.stories.details(), id] as const,
  },

  // Story Pages (for storybook experience)
  storyPages: {
    all: ['story-pages'] as const,
    forStory: (storyId: string) => [...queryKeys.storyPages.all, storyId] as const,
    illustrationStatus: (storyId: string) =>
      [...queryKeys.storyPages.all, 'illustration-status', storyId] as const,
  },

  // Family
  family: {
    all: ['family'] as const,
    members: (userId: string) => [...queryKeys.family.all, 'members', userId] as const,
    member: (id: string) => [...queryKeys.family.all, 'member', id] as const,
    relationships: (userId: string) => [...queryKeys.family.all, 'relationships', userId] as const,
    tree: (userId: string) => [...queryKeys.family.all, 'tree', userId] as const,
  },

  // Journeys
  journeys: {
    all: ['journeys'] as const,
    lists: () => [...queryKeys.journeys.all, 'list'] as const,
    forChild: (childId: string) => [...queryKeys.journeys.lists(), 'child', childId] as const,
    active: (childId: string) => [...queryKeys.journeys.lists(), 'active', childId] as const,
    completed: (childId: string) => [...queryKeys.journeys.lists(), 'completed', childId] as const,
    details: () => [...queryKeys.journeys.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.journeys.details(), id] as const,
    progress: (id: string) => [...queryKeys.journeys.all, 'progress', id] as const,
  },

  // Guardrails
  guardrails: {
    all: ['guardrails'] as const,
    settings: (childId: string) => [...queryKeys.guardrails.all, 'settings', childId] as const,
  },

  // Avatars
  avatars: {
    all: ['avatars'] as const,
    lists: () => [...queryKeys.avatars.all, 'list'] as const,
    listAll: () => [...queryKeys.avatars.lists(), 'all'] as const,
    listByCategory: (category: string) => [...queryKeys.avatars.lists(), 'category', category] as const,
    categories: () => [...queryKeys.avatars.all, 'categories'] as const,
    details: () => [...queryKeys.avatars.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.avatars.details(), id] as const,
    search: (query: string) => [...queryKeys.avatars.all, 'search', query] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Chat
  chat: {
    all: ['chat'] as const,
    messages: (sessionId: string) => [...queryKeys.chat.all, 'messages', sessionId] as const,
    session: (childId: string) => [...queryKeys.chat.all, 'session', childId] as const,
  },

  // Buddy Chat
  buddyChat: {
    all: ['buddy-chat'] as const,
    messages: (childId: string) => [...queryKeys.buddyChat.all, 'messages', childId] as const,
    buddy: (childId: string) => [...queryKeys.buddyChat.all, 'buddy', childId] as const,
    safetyReports: (userId: string, unreadOnly: boolean) =>
      [...queryKeys.buddyChat.all, 'safety-reports', userId, unreadOnly] as const,
  },

  // Gamification
  gamification: {
    all: ['gamification'] as const,
    activityTypes: () => [...queryKeys.gamification.all, 'activity-types'] as const,
    stats: (childId: string) => [...queryKeys.gamification.all, 'stats', childId] as const,
    badges: (childId: string) => [...queryKeys.gamification.all, 'badges', childId] as const,
    activities: (childId: string) => [...queryKeys.gamification.all, 'activities', childId] as const,
    leaderboard: () => [...queryKeys.gamification.all, 'leaderboard'] as const,
  },

  // PIN
  pin: {
    all: ['pin'] as const,
    status: (childId: string) => [...queryKeys.pin.all, 'status', childId] as const,
  },

  // Journey Templates
  journeyTemplates: {
    all: ['journey-templates'] as const,
    lists: () => [...queryKeys.journeyTemplates.all, 'list'] as const,
    list: (filters?: object) => [...queryKeys.journeyTemplates.lists(), filters] as const,
    categories: () => [...queryKeys.journeyTemplates.all, 'categories'] as const,
    featured: () => [...queryKeys.journeyTemplates.all, 'featured'] as const,
    forChild: (childId: string) => [...queryKeys.journeyTemplates.all, 'for-child', childId] as const,
    details: () => [...queryKeys.journeyTemplates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.journeyTemplates.details(), id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    overview: () => [...queryKeys.analytics.all, 'overview'] as const,
    activity: (childId: string, days?: number) =>
      [...queryKeys.analytics.all, 'activity', childId, days] as const,
    weekly: (childId: string) => [...queryKeys.analytics.all, 'weekly', childId] as const,
    topics: (childId: string, limit?: number) =>
      [...queryKeys.analytics.all, 'topics', childId, limit] as const,
    journeyProgress: (childId: string) =>
      [...queryKeys.analytics.all, 'journey-progress', childId] as const,
  },

  // Topics
  topics: {
    all: ['topics'] as const,
    categories: () => [...queryKeys.topics.all, 'categories'] as const,
    childSettings: (childId: string) =>
      [...queryKeys.topics.all, 'child-settings', childId] as const,
  },

  // Content Library
  contentLibrary: {
    all: ['content-library'] as const,
    lists: () => [...queryKeys.contentLibrary.all, 'list'] as const,
    list: (filters?: object) => [...queryKeys.contentLibrary.lists(), filters] as const,
    details: () => [...queryKeys.contentLibrary.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contentLibrary.details(), id] as const,
  },

  // Voice Vault
  voiceVault: {
    all: ['voice-vault'] as const,
    lists: () => [...queryKeys.voiceVault.all, 'list'] as const,
    list: (filters?: object) => [...queryKeys.voiceVault.lists(), filters] as const,
    categories: () => [...queryKeys.voiceVault.all, 'categories'] as const,
    details: () => [...queryKeys.voiceVault.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.voiceVault.details(), id] as const,
  },

  // Family Events
  familyEvents: {
    all: ['family-events'] as const,
    events: () => [...queryKeys.familyEvents.all, 'events'] as const,
    eventList: (filters?: object) => [...queryKeys.familyEvents.events(), filters] as const,
    eventTypes: () => [...queryKeys.familyEvents.all, 'event-types'] as const,
    eventDetail: (id: string) => [...queryKeys.familyEvents.events(), 'detail', id] as const,
    photos: () => [...queryKeys.familyEvents.all, 'photos'] as const,
    photoList: (filters?: object) => [...queryKeys.familyEvents.photos(), filters] as const,
    timeline: (limit?: number) => [...queryKeys.familyEvents.all, 'timeline', limit] as const,
    exportConfigs: () => [...queryKeys.familyEvents.all, 'export-configs'] as const,
  },

  // Kids Mode
  kidsMode: {
    all: ['kids-mode'] as const,
    configs: () => [...queryKeys.kidsMode.all, 'configs'] as const,
    personalities: () => [...queryKeys.kidsMode.all, 'personalities'] as const,
    personality: (key: string) => [...queryKeys.kidsMode.all, 'personality', key] as const,
    storySettings: (childId: string) => [...queryKeys.kidsMode.all, 'story-settings', childId] as const,
  },

  // Onboarding
  onboarding: {
    all: ['onboarding'] as const,
    progress: (childId: string) => [...queryKeys.onboarding.all, 'progress', childId] as const,
    status: (childId: string) => [...queryKeys.onboarding.all, 'status', childId] as const,
  },
} as const;
