/**
 * Form Types & Validation Schemas
 *
 * Zod schemas for form validation with TypeScript inference.
 */

import { z } from 'zod';

// Child Profile Schema
export const createChildSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(3, 'Minimum age is 3')
    .max(18, 'Maximum age is 18'),
  avatarLibraryId: z.string().uuid().optional(),
  personalityMode: z
    .enum(['curious_explorer', 'patient_teacher', 'playful_friend', 'storyteller'])
    .optional()
    .default('curious_explorer'),
});

export type CreateChildFormData = z.infer<typeof createChildSchema>;

export const updateChildSchema = createChildSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateChildFormData = z.infer<typeof updateChildSchema>;

// Story Creation Schema
export const createStorySchema = z.object({
  theme: z
    .string()
    .min(10, 'Theme must be at least 10 characters')
    .max(200, 'Theme must be less than 200 characters'),
  characters: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        role: z.enum(['main', 'supporting']),
        description: z.string().max(100).optional(),
      })
    )
    .min(1, 'At least one character is required')
    .max(5, 'Maximum 5 characters allowed'),
  mood: z.enum(['adventurous', 'calm', 'funny', 'magical', 'educational']),
  values: z.array(z.string()).max(3, 'Maximum 3 values allowed'),
  storyLength: z.enum(['short', 'medium', 'long']),
  illustrationStyle: z.enum(['cartoon', 'watercolor', 'storybook', 'minimalist']),
  narrationVoice: z.enum(['alloy', 'nova', 'shimmer']),
});

export type CreateStoryFormData = z.infer<typeof createStorySchema>;

// Family Member Schema
export const createFamilyMemberSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  relationshipToChild: z.enum([
    'parent',
    'grandparent',
    'sibling',
    'aunt_uncle',
    'cousin',
    'spouse',
    'child',
    'other',
  ]),
  birthYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  deathYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  birthPlace: z.string().max(200).optional(),
  occupation: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
  isLiving: z.boolean().default(true),
  hobbies: z.array(z.string().max(50)).max(20).optional(),
  funFacts: z.string().max(2000).optional(),
  connectionDescription: z.string().max(200).optional(),
  photoDescription: z.string().max(1000).optional(),
});

export type CreateFamilyMemberFormData = z.infer<typeof createFamilyMemberSchema>;

// Journey Creation Schema
export const createJourneySchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500).optional(),
  category: z.enum(['habit', 'learning', 'social', 'health', 'creativity']),
  totalSteps: z.number().int().min(3).max(30),
  scheduleTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

export type CreateJourneyFormData = z.infer<typeof createJourneySchema>;

// Guardrail Settings Schema
export const guardrailSettingsSchema = z.object({
  strictnessLevel: z.enum(['low', 'medium', 'high']),
  blockOnYellow: z.boolean(),
  notifyOnYellow: z.boolean(),
  notifyOnGreen: z.boolean(),
  messagesPerMinute: z.number().int().min(1).max(60),
  messagesPerHour: z.number().int().min(1).max(500),
  maxResponseLength: z.number().int().min(100).max(2000),
  preferredAiTone: z.string().min(1).max(50),
  customBlockedKeywords: z.array(z.string().max(50)).max(100),
  customAllowedPhrases: z.array(z.string().max(100)).max(50),
  autoExpandTopics: z.boolean(),
  learnFromApprovals: z.boolean(),
});

export type GuardrailSettingsFormData = z.infer<typeof guardrailSettingsSchema>;

// PIN Schema
export const pinSchema = z.object({
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers'),
  confirmPin: z.string(),
}).refine((data) => data.pin === data.confirmPin, {
  message: 'PINs do not match',
  path: ['confirmPin'],
});

export type PinFormData = z.infer<typeof pinSchema>;

// Auth Schemas
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const signUpSchema = signInSchema.extend({
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// Topic Schema
export const createTopicSchema = z.object({
  topic: z
    .string()
    .min(2, 'Topic must be at least 2 characters')
    .max(50, 'Topic must be less than 50 characters'),
});

export type CreateTopicFormData = z.infer<typeof createTopicSchema>;

// Voice Clip Schema
export const createVoiceClipSchema = z.object({
  clipName: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  category: z.enum(['encouragement', 'praise', 'celebration']),
});

export type CreateVoiceClipFormData = z.infer<typeof createVoiceClipSchema>;
