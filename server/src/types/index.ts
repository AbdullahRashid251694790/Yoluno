// User types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  expires_at: Date;
  created_at: Date;
}

// Child profile types
export interface ChildProfile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  gender?: 'boy' | 'girl' | 'prefer_not_to_say';
  avatar_id?: string;
  custom_avatar_url?: string;
  interests?: string[];
  learning_style?: string;
  pin_hash?: string;
  last_active_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Story types
export interface Story {
  id: string;
  child_profile_id: string;
  title: string;
  content: string;
  theme?: string;
  mood?: string;
  values?: string[];
  word_count?: number;
  illustration_style?: string;
  illustration_url?: string;
  cover_image_url?: string;
  has_pages: boolean;
  narrator_voice?: string;
  protagonist_avatar?: string;
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
}

// Story Page types (for storybook experience)
export type IllustrationStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface StoryPage {
  id: string;
  story_id: string;
  page_number: number;
  content: string;
  illustration_prompt?: string;
  illustration_url?: string;
  illustration_status: IllustrationStatus;
  audio_url?: string;
  audio_duration_ms?: number;
  created_at: Date;
  updated_at: Date;
}

// Family types
export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  birth_date?: string;
  notes?: string;
  is_alive: boolean;
  photo_url?: string;
  occupation?: string;
  hobbies?: string[];
  fun_facts?: string;
  connection_description?: string;
  photo_description?: string;
  generation_level?: number;
  position_x?: number;
  position_y?: number;
  created_at: Date;
  updated_at: Date;
}

export interface FamilyRelationship {
  id: string;
  user_id: string;
  member1_id: string;
  member2_id: string;
  relationship_type: string;
  created_at: Date;
}

// Journey types
export interface Journey {
  id: string;
  child_profile_id: string;
  title: string;
  template_id?: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  created_at: Date;
  updated_at: Date;
}

export interface JourneyStep {
  id: string;
  journey_id: string;
  type: string;
  step_order: number;
  content?: Record<string, unknown>;
  progress: number;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Guardrail types
export interface GuardrailSettings {
  id: string;
  child_profile_id: string;
  max_session_time?: number;
  break_interval?: number;
  content_filters?: Record<string, unknown>;
  allowed_topics?: string[];
  blocked_topics?: string[];
  created_at: Date;
  updated_at: Date;
}

// Avatar types
export interface Avatar {
  id: string;
  name: string;
  image_url: string;
  category?: string;
  tags?: string[];
  is_premium: boolean;
  created_at: Date;
}

// Buddy chat types
export interface ChatBuddy {
  id: string;
  child_profile_id: string;
  name: string;
  personality_traits?: Record<string, unknown>;
  conversation_context?: string;
  learned_preferences?: Record<string, unknown>;
  message_count: number;
  last_interaction_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BuddyMessage {
  id: string;
  child_profile_id: string;
  role: 'child' | 'buddy' | 'system';
  content: string;
  safety_level: 'green' | 'yellow' | 'red';
  safety_flags?: Record<string, unknown>;
  created_at: Date;
}

export interface SafetyReport {
  id: string;
  user_id: string;
  child_profile_id: string;
  message_id?: string;
  severity: 'yellow' | 'red';
  issue_summary: string;
  full_context?: Record<string, unknown>;
  reviewed: boolean;
  parent_notes?: string;
  created_at: Date;
  updated_at: Date;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    email_verified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

// Parent notification types
export type NotificationType = 'password_change_request' | 'other';

export interface ParentNotification {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  read_at: Date | null;
}
