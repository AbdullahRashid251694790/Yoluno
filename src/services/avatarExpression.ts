/**
 * Avatar Expression Service
 *
 * Business logic for determining buddy avatar expressions
 * based on conversation context. Extracted from BuddyChat
 * component for SOLID compliance (Single Responsibility).
 */

import type { AvatarExpression } from '@/types/domain';

/**
 * Context for determining avatar expression
 */
export interface ExpressionContext {
  /** Whether the buddy is currently processing a response */
  isSending: boolean;
  /** Whether the user is typing */
  isTyping: boolean;
  /** Content of the last buddy message */
  lastMessageContent?: string;
  /** Total number of messages in the conversation */
  messageCount?: number;
}

/**
 * Suggestion for contextual chat responses
 */
export interface ChatSuggestion {
  id: string;
  label: string;
  emoji: string;
}

/**
 * Default suggestions for new conversations
 */
export const defaultSuggestions: ChatSuggestion[] = [
  { id: 'tell-story', label: 'Tell me a story', emoji: '📖' },
  { id: 'learn-something', label: "Let's learn something!", emoji: '🎓' },
  { id: 'play-game', label: 'Play a game', emoji: '🎮' },
];

/**
 * Topic-specific suggestion sets
 */
const TOPIC_SUGGESTIONS: Record<string, ChatSuggestion[]> = {
  space: [
    { id: 'moon', label: 'The Moon', emoji: '🌙' },
    { id: 'planets', label: 'Planets', emoji: '🪐' },
    { id: 'astronauts', label: 'Astronauts', emoji: '👨‍🚀' },
  ],
  dinosaur: [
    { id: 'trex', label: 'T-Rex', emoji: '🦖' },
    { id: 'flying', label: 'Flying dinosaurs', emoji: '🦅' },
    { id: 'biggest', label: 'Biggest dinosaur', emoji: '🦕' },
  ],
};

/**
 * Response suggestion sets for yes/no questions
 */
const YES_NO_SUGGESTIONS: ChatSuggestion[] = [
  { id: 'yes', label: 'Yes please!', emoji: '👍' },
  { id: 'no', label: 'Maybe later', emoji: '🤔' },
  { id: 'different', label: 'Something else', emoji: '💭' },
];

/**
 * Response suggestion sets for favorite questions
 */
const FAVORITE_SUGGESTIONS: ChatSuggestion[] = [
  { id: 'dog', label: 'Dogs', emoji: '🐕' },
  { id: 'cat', label: 'Cats', emoji: '🐱' },
  { id: 'other', label: 'Something else', emoji: '🦋' },
];

/**
 * Keywords that trigger specific expressions
 */
const EXPRESSION_KEYWORDS = {
  teaching: ['learn', 'did you know', '?'],
  creative: ['once upon', 'story', 'imagine'],
  proud: ['great', 'proud', 'amazing', 'awesome', 'wonderful'],
  caring: ['understand', 'feel', 'okay', 'sorry', 'help'],
} as const;

/**
 * Get the appropriate avatar expression based on context
 */
export function getSmartExpression(context: ExpressionContext): AvatarExpression {
  const { isSending, isTyping, lastMessageContent, messageCount } = context;

  // Processing states take priority
  if (isSending) return 'thinking';
  if (isTyping) return 'listening';

  // Analyze last message content
  if (lastMessageContent) {
    const content = lastMessageContent.toLowerCase();

    // Check for educational content
    if (EXPRESSION_KEYWORDS.teaching.some((kw) => content.includes(kw))) {
      return 'teaching';
    }

    // Check for creative/story content
    if (EXPRESSION_KEYWORDS.creative.some((kw) => content.includes(kw))) {
      return 'creative';
    }

    // Check for praise/encouragement
    if (EXPRESSION_KEYWORDS.proud.some((kw) => content.includes(kw))) {
      return 'proud';
    }

    // Check for empathetic/supportive content
    if (EXPRESSION_KEYWORDS.caring.some((kw) => content.includes(kw))) {
      return 'caring';
    }
  }

  // First few messages - show excitement
  if (messageCount !== undefined && messageCount < 3) {
    return 'excited';
  }

  // Default happy expression
  return 'happy';
}

/**
 * Get contextual chat suggestions based on conversation
 */
export function getContextualSuggestions(
  lastBuddyMessageContent?: string
): ChatSuggestion[] {
  if (!lastBuddyMessageContent) {
    return defaultSuggestions;
  }

  const content = lastBuddyMessageContent.toLowerCase();

  // If asking a question, provide relevant follow-ups
  if (content.includes('?')) {
    if (content.includes('want to') || content.includes('would you like')) {
      return YES_NO_SUGGESTIONS;
    }
    if (content.includes('animal') || content.includes('favorite')) {
      return FAVORITE_SUGGESTIONS;
    }
  }

  // Topic-based suggestions
  for (const [topic, suggestions] of Object.entries(TOPIC_SUGGESTIONS)) {
    if (content.includes(topic)) {
      return suggestions;
    }
  }

  return defaultSuggestions;
}

/**
 * Avatar expression service object
 */
export const avatarExpressionService = {
  getExpression: getSmartExpression,
  getSuggestions: getContextualSuggestions,
  defaultSuggestions,
};
