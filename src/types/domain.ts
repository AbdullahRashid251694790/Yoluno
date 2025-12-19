/**
 * Domain Types
 *
 * Business domain types that extend database types
 * with computed properties and relationships.
 */

// Personality Modes
export type PersonalityMode =
  | 'curious_explorer'
  | 'patient_teacher'
  | 'playful_friend'
  | 'storyteller';

export const PERSONALITY_MODES: Record<PersonalityMode, { label: string; description: string }> = {
  curious_explorer: {
    label: 'Curious Explorer',
    description: 'Asks "Why?" and "What if?" questions to spark curiosity',
  },
  patient_teacher: {
    label: 'Patient Teacher',
    description: 'Breaks answers into numbered steps for easy learning',
  },
  playful_friend: {
    label: 'Playful Friend',
    description: 'Uses jokes, emojis, and fun examples',
  },
  storyteller: {
    label: 'Storyteller',
    description: 'Weaves knowledge into engaging narratives',
  },
};

// Avatar Expressions - 12 emotional states for buddy interactions
export type AvatarExpression =
  | 'neutral'    // Default idle state
  | 'happy'      // General positive response
  | 'thinking'   // Processing/loading state
  | 'excited'    // Achievement, new discovery
  | 'curious'    // Asking questions
  | 'caring'     // Comforting, supportive
  | 'teaching'   // Explaining something
  | 'creative'   // Story mode, artistic
  | 'surprised'  // New topic, unexpected
  | 'proud'      // Milestone reached
  | 'sleepy'     // Night mode, wind down
  | 'listening'; // User is typing/speaking

export interface BuddyExpressionConfig {
  emoji: string;
  label: string;
  animation: string;
  color: string;
}

export const BUDDY_EXPRESSIONS: Record<AvatarExpression, BuddyExpressionConfig> = {
  neutral: { emoji: '😊', label: 'Friendly', animation: '', color: 'from-primary/20 to-primary/10' },
  happy: { emoji: '😄', label: 'Happy', animation: 'animate-bounce-gentle', color: 'from-yellow-200 to-orange-100' },
  thinking: { emoji: '🤔', label: 'Thinking', animation: 'animate-pulse', color: 'from-blue-200 to-indigo-100' },
  excited: { emoji: '🎉', label: 'Excited', animation: 'animate-wiggle', color: 'from-pink-200 to-purple-100' },
  curious: { emoji: '🧐', label: 'Curious', animation: 'animate-float', color: 'from-cyan-200 to-blue-100' },
  caring: { emoji: '🤗', label: 'Caring', animation: 'animate-heartbeat', color: 'from-rose-200 to-pink-100' },
  teaching: { emoji: '📚', label: 'Teaching', animation: '', color: 'from-emerald-200 to-teal-100' },
  creative: { emoji: '🎨', label: 'Creative', animation: 'animate-sparkle', color: 'from-violet-200 to-fuchsia-100' },
  surprised: { emoji: '😮', label: 'Surprised', animation: 'animate-pop', color: 'from-amber-200 to-yellow-100' },
  proud: { emoji: '🌟', label: 'Proud', animation: 'animate-pulse-glow', color: 'from-yellow-300 to-amber-200' },
  sleepy: { emoji: '😴', label: 'Sleepy', animation: '', color: 'from-indigo-300 to-purple-200' },
  listening: { emoji: '👂', label: 'Listening', animation: 'animate-pulse', color: 'from-sky-200 to-blue-100' },
};

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

export const AVATAR_SIZES: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
  '2xl': 'w-24 h-24',
  '3xl': 'w-32 h-32',
  '4xl': 'w-40 h-40',
  '5xl': 'w-48 h-48',
};

// Story Types
export interface StoryCharacter {
  name: string;
  role: 'main' | 'supporting';
  description?: string;
}

export interface StoryScene {
  sceneNumber: number;
  description: string;
  imageUrl?: string;
  imageError?: boolean;
}

export type StoryMood = 'adventurous' | 'calm' | 'funny' | 'magical' | 'educational';

export type IllustrationStyle = 'cartoon' | 'watercolor' | 'storybook' | 'minimalist';

export type NarrationVoice = 'alloy' | 'nova' | 'shimmer';

export interface StoryWizardData {
  theme: string;
  characters: StoryCharacter[];
  mood: StoryMood;
  values: string[];
  storyLength: 'short' | 'medium' | 'long';
  illustrationStyle: IllustrationStyle;
  narrationVoice: NarrationVoice;
}

// Journey Types
export type JourneyStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export type JourneyCategory = 'habit' | 'learning' | 'social' | 'health' | 'creativity';

export interface JourneyWithSteps {
  id: string;
  title: string;
  description: string | null;
  status: JourneyStatus;
  category?: JourneyCategory;
  currentStep: number;
  totalSteps: number;
  startedAt?: string;
  completedAt: string | null;
  steps: JourneyStep[];
  progress?: number;
  childProfileId?: string;
  templateId?: string;
  createdAt?: Date;
}

export interface JourneyStep {
  id: string;
  journeyId: string;
  stepNumber: number;
  title: string;
  description: string | null;
  isCompleted: boolean;
  completedAt: string | null;
}

// Memory Types
export type MemoryType = 'preference' | 'fact' | 'interest' | 'learning_progress' | 'achievement';

export interface ChildMemory {
  id: string;
  type: MemoryType;
  key: string;
  value: string;
  importanceScore: number;
  lastAccessedAt: string;
}

// Chat Types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// Family Types
export type RelationshipType =
  | 'parent'
  | 'grandparent'
  | 'sibling'
  | 'aunt_uncle'
  | 'cousin'
  | 'spouse'
  | 'child'
  | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  relationshipToChild: RelationshipType;
  birthYear?: number;
  deathYear?: number;
  birthPlace?: string;
  occupation?: string;
  bio?: string;
  photoUrl?: string;
  isLiving: boolean;
  hobbies?: string[];
  funFacts?: string;
  connectionDescription?: string;
  photoDescription?: string;
  generationLevel?: number;
  positionX?: number;
  positionY?: number;
}

export interface FamilyRelationship {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipType: RelationshipType;
}

// Safety Types
export type SafetyLevel = 'green' | 'yellow' | 'red';

export type StrictnessLevel = 'low' | 'medium' | 'high';

export interface GuardrailSettings {
  strictnessLevel: StrictnessLevel;
  blockOnYellow: boolean;
  notifyOnYellow: boolean;
  notifyOnGreen: boolean;
  messagesPerMinute: number;
  messagesPerHour: number;
  maxResponseLength: number;
  preferredAiTone: string;
  customBlockedKeywords: string[];
  customAllowedPhrases: string[];
  autoExpandTopics: boolean;
  learnFromApprovals: boolean;
}

export const DEFAULT_GUARDRAIL_SETTINGS: Partial<GuardrailSettings> = {
  strictnessLevel: 'medium',
  blockOnYellow: false,
  notifyOnYellow: true,
  notifyOnGreen: false,
  messagesPerMinute: 10,
  messagesPerHour: 100,
  maxResponseLength: 500,
  preferredAiTone: 'friendly',
  customBlockedKeywords: [],
  customAllowedPhrases: [],
  autoExpandTopics: false,
  learnFromApprovals: true,
};

// Badge Types
export type BadgeCategory = 'streak' | 'learning' | 'story' | 'journey' | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconUrl: string;
  earnedAt?: string;
}

// Subscription Types
export type SubscriptionTier = 'free' | 'basic' | 'plus' | 'pro';

export interface SubscriptionLimits {
  storiesPerMonth: number;
  familyPhotos: number;
  audioMinutes: number;
  childProfiles: number;
  customContent: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: { storiesPerMonth: 5, familyPhotos: 10, audioMinutes: 5, childProfiles: 1, customContent: 5 },
  basic: { storiesPerMonth: 20, familyPhotos: 100, audioMinutes: 30, childProfiles: 3, customContent: 25 },
  plus: { storiesPerMonth: 50, familyPhotos: 500, audioMinutes: 120, childProfiles: 5, customContent: 100 },
  pro: { storiesPerMonth: Infinity, familyPhotos: Infinity, audioMinutes: 300, childProfiles: 10, customContent: Infinity },
};
