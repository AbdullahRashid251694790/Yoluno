/**
 * Mood Responses Library
 *
 * Luno's personalized responses and activity suggestions
 * based on child's mood during check-in.
 *
 * Based on PRD: "Inside Out meets Baymax" - friendly, caring, not clinical.
 */

import type { MoodType } from '@/services/moodCheckin';

export interface MoodConfig {
  emoji: string;
  label: string;
  color: string;
  bgGradient: string;
  responses: string[];
  activities: ActivitySuggestion[];
}

export interface ActivitySuggestion {
  id: string;
  title: string;
  description: string;
  emoji: string;
  path: 'chat' | 'stories' | 'journeys' | 'family';
}

/**
 * Mood configurations with colors, responses, and activity suggestions
 */
export const moodConfigs: Record<MoodType, MoodConfig> = {
  happy: {
    emoji: '😊',
    label: 'Happy',
    color: 'text-yellow-600',
    bgGradient: 'from-yellow-200 to-orange-200',
    responses: [
      "That's wonderful! I'm so happy you're feeling great today!",
      "Yay! Your happiness makes me smile too!",
      "Amazing! Let's keep that wonderful energy going!",
      "How lovely! Happy feelings are the best!",
      "Hooray! I can feel your good vibes from here!",
    ],
    activities: [
      {
        id: 'happy-chat',
        title: "Let's Chat!",
        description: 'Share what made you happy!',
        emoji: '💬',
        path: 'chat',
      },
      {
        id: 'happy-story',
        title: 'Adventure Story',
        description: 'Create an exciting tale together!',
        emoji: '🚀',
        path: 'stories',
      },
      {
        id: 'happy-journey',
        title: 'New Challenge',
        description: 'Start a fun new journey!',
        emoji: '🎯',
        path: 'journeys',
      },
    ],
  },

  sad: {
    emoji: '😢',
    label: 'Sad',
    color: 'text-blue-600',
    bgGradient: 'from-blue-200 to-indigo-200',
    responses: [
      "I'm here for you. It's okay to feel sad sometimes.",
      "Aww, I'm sorry you're feeling down. Want to do something cozy together?",
      "Even rainy days end with rainbows. I'm right here with you.",
      "It's okay to feel this way. Would you like a gentle hug?",
      "I care about you. Let's do something that might help you feel better.",
    ],
    activities: [
      {
        id: 'sad-chat',
        title: 'Talk About It',
        description: "I'm here to listen",
        emoji: '💙',
        path: 'chat',
      },
      {
        id: 'sad-story',
        title: 'Cozy Story',
        description: 'A warm, comforting tale',
        emoji: '🌈',
        path: 'stories',
      },
      {
        id: 'sad-family',
        title: 'Family Photos',
        description: 'Look at happy memories',
        emoji: '📸',
        path: 'family',
      },
    ],
  },

  angry: {
    emoji: '😠',
    label: 'Angry',
    color: 'text-red-600',
    bgGradient: 'from-red-200 to-orange-200',
    responses: [
      "It's okay to feel angry sometimes. Let's take a deep breath together.",
      "I understand you're upset. Want to tell me about it?",
      "Feeling angry is normal. Let's find something calming to do.",
      "Big feelings need big breaths. Breathe in... and out...",
      "I'm here for you even when things feel stormy.",
    ],
    activities: [
      {
        id: 'angry-chat',
        title: 'Talk It Out',
        description: 'Tell me what happened',
        emoji: '🗣️',
        path: 'chat',
      },
      {
        id: 'angry-story',
        title: 'Calming Story',
        description: 'A peaceful adventure',
        emoji: '🌊',
        path: 'stories',
      },
      {
        id: 'angry-journey',
        title: 'Calm Down Journey',
        description: 'Breathing exercises',
        emoji: '🧘',
        path: 'journeys',
      },
    ],
  },

  scared: {
    emoji: '😨',
    label: 'Scared',
    color: 'text-purple-600',
    bgGradient: 'from-purple-200 to-indigo-200',
    responses: [
      "You're safe here with me. Want to hear something nice?",
      "It's brave to share when you're scared. I'm right here!",
      "Don't worry, I've got you. We can do something fun together.",
      "Being scared is okay. You're not alone - I'm here!",
      "Let's think about happy things together. You're safe with me.",
    ],
    activities: [
      {
        id: 'scared-chat',
        title: 'Safe Space',
        description: "Let's talk about it",
        emoji: '🏠',
        path: 'chat',
      },
      {
        id: 'scared-story',
        title: 'Brave Story',
        description: 'A story about courage',
        emoji: '🦁',
        path: 'stories',
      },
      {
        id: 'scared-family',
        title: 'Family Love',
        description: 'See your loved ones',
        emoji: '❤️',
        path: 'family',
      },
    ],
  },

  calm: {
    emoji: '😌',
    label: 'Calm',
    color: 'text-green-600',
    bgGradient: 'from-green-200 to-teal-200',
    responses: [
      "Nice and peaceful! What would you like to do today?",
      "That calm feeling is so nice. Ready for something fun?",
      "Perfect! A clear mind is ready for anything!",
      "Wonderful! Feeling calm means we can do anything we want!",
      "Great! What sounds fun to you right now?",
    ],
    activities: [
      {
        id: 'calm-chat',
        title: "Let's Chat!",
        description: 'Explore anything you want',
        emoji: '💭',
        path: 'chat',
      },
      {
        id: 'calm-story',
        title: 'Create a Story',
        description: 'Any adventure you imagine',
        emoji: '✨',
        path: 'stories',
      },
      {
        id: 'calm-journey',
        title: 'Pick a Journey',
        description: 'Learn something new',
        emoji: '🗺️',
        path: 'journeys',
      },
    ],
  },
};

/**
 * Get a random Luno response for a mood
 */
export function getLunoMoodResponse(mood: MoodType): string {
  const config = moodConfigs[mood];
  const responses = config.responses;
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Get activity suggestions for a mood
 */
export function getSuggestedActivities(mood: MoodType): ActivitySuggestion[] {
  return moodConfigs[mood].activities;
}

/**
 * Get mood configuration
 */
export function getMoodConfig(mood: MoodType): MoodConfig {
  return moodConfigs[mood];
}

/**
 * Get all mood types for rendering mood selection buttons
 */
export function getAllMoods(): MoodType[] {
  return ['happy', 'sad', 'angry', 'scared', 'calm'];
}

/**
 * Get mood emoji
 */
export function getMoodEmoji(mood: MoodType): string {
  return moodConfigs[mood].emoji;
}

/**
 * Get mood label
 */
export function getMoodLabel(mood: MoodType): string {
  return moodConfigs[mood].label;
}

/**
 * Get mood background gradient class
 */
export function getMoodGradient(mood: MoodType): string {
  return moodConfigs[mood].bgGradient;
}
