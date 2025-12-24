/**
 * Database Types
 *
 * Type definitions for database tables.
 * These match the Railway PostgreSQL schema.
 */

// Child Profile
export interface ChildProfileRow {
  id: string;
  user_id: string;
  name: string;
  age: number;
  avatar_id: string | null;
  interests: string[];
  personality_traits: string[];
  learning_style: string | null;
  pin_hash: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}
export type ChildProfileInsert = Omit<ChildProfileRow, 'id' | 'created_at' | 'updated_at'>;
export type ChildProfileUpdate = Partial<Omit<ChildProfileRow, 'id' | 'user_id' | 'created_at'>>;

// Stories
export interface StoryRow {
  id: string;
  child_profile_id: string;
  title: string;
  content: string;
  theme: string | null;
  characters: string[];
  word_count: number;
  illustration_url: string | null;
  is_favorite: boolean;
  created_at: string;
}
export type StoryInsert = Omit<StoryRow, 'id' | 'created_at'>;
export type StoryUpdate = Partial<Omit<StoryRow, 'id' | 'child_profile_id' | 'created_at'>>;

// Chat Sessions
export interface ChatSessionRow {
  id: string;
  child_profile_id: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}
export type ChatSessionInsert = Omit<ChatSessionRow, 'id' | 'started_at'>;

// Chat Messages
export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
export type ChatMessageInsert = Omit<ChatMessageRow, 'id' | 'created_at'>;

// Family Members
export interface FamilyMemberRow {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  birth_date: string | null;
  photo_url: string | null;
  notes: string | null;
  is_alive: boolean;
  generation: number;
  occupation: string | null;
  hobbies: string[];
  fun_facts: string | null;
  connection_description: string | null;
  photo_description: string | null;
  generation_level: number | null;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}
export type FamilyMemberInsert = Omit<FamilyMemberRow, 'id' | 'created_at' | 'updated_at'>;
export type FamilyMemberUpdate = Partial<Omit<FamilyMemberRow, 'id' | 'user_id' | 'created_at'>>;

// Family Relationships
export interface FamilyRelationshipRow {
  id: string;
  user_id: string;
  from_member_id: string;
  to_member_id: string;
  relationship_type: string;
  created_at: string;
}
export type FamilyRelationshipInsert = Omit<FamilyRelationshipRow, 'id' | 'created_at'>;

// Journeys
export interface JourneyRow {
  id: string;
  child_profile_id: string;
  template_id: string | null;
  title: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  completed_at: string | null;
}
export type JourneyInsert = Omit<JourneyRow, 'id' | 'created_at'>;
export type JourneyUpdate = Partial<Omit<JourneyRow, 'id' | 'child_profile_id' | 'created_at'>>;

// Journey Steps
export interface JourneyStepRow {
  id: string;
  journey_id: string;
  type: string;
  step_order: number;
  progress: number;
  completed_at: string | null;
  created_at: string;
}
export type JourneyStepInsert = Omit<JourneyStepRow, 'id' | 'created_at'>;
export type JourneyStepUpdate = Partial<Omit<JourneyStepRow, 'id' | 'journey_id' | 'created_at'>>;

// Guardrail Settings
export interface GuardrailSettingsRow {
  id: string;
  child_profile_id: string;
  safety_level: 'strict' | 'moderate' | 'relaxed';
  allowed_topics: string[];
  blocked_topics: string[];
  max_session_minutes: number;
  require_breaks: boolean;
  break_interval_minutes: number;
  content_filters_enabled: boolean;
  created_at: string;
  updated_at: string;
}
export type GuardrailSettingsInsert = Omit<GuardrailSettingsRow, 'id' | 'created_at' | 'updated_at'>;
export type GuardrailSettingsUpdate = Partial<Omit<GuardrailSettingsRow, 'id' | 'child_profile_id' | 'created_at'>>;

// Avatar Library
export interface AvatarLibraryRow {
  id: string;
  name: string;
  category: string;
  image_url: string;
  is_premium: boolean;
  tags: string[];
  created_at: string;
}

// User Subscriptions
export interface UserSubscriptionRow {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'family';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
  created_at: string;
}
export type UserSubscriptionInsert = Omit<UserSubscriptionRow, 'id' | 'created_at'>;
export type UserSubscriptionUpdate = Partial<Omit<UserSubscriptionRow, 'id' | 'user_id' | 'created_at'>>;

// Chat Buddies
export interface ChatBuddyRow {
  id: string;
  child_profile_id: string;
  name: string;
  personality: string;
  avatar_url: string | null;
  voice_id: string | null;
  created_at: string;
  updated_at: string;
}
export type ChatBuddyInsert = Omit<ChatBuddyRow, 'id' | 'created_at' | 'updated_at'>;
export type ChatBuddyUpdate = Partial<Omit<ChatBuddyRow, 'id' | 'child_profile_id' | 'created_at'>>;

// Buddy Messages
export interface BuddyMessageRow {
  id: string;
  child_profile_id: string;
  buddy_id: string;
  role: 'user' | 'assistant';
  content: string;
  audio_url: string | null;
  created_at: string;
}
export type BuddyMessageInsert = Omit<BuddyMessageRow, 'id' | 'created_at'>;

// Safety Reports
export interface SafetyReportRow {
  id: string;
  user_id: string;
  child_profile_id: string;
  message_id: string | null;
  severity: 'green' | 'yellow' | 'red';
  issue_type: string;
  issue_summary: string;
  context: string | null;
  is_read: boolean;
  created_at: string;
}
export type SafetyReportInsert = Omit<SafetyReportRow, 'id' | 'created_at'>;
export type SafetyReportUpdate = Partial<Pick<SafetyReportRow, 'is_read'>>;
