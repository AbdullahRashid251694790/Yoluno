-- Initial schema adapted from Supabase migration 20231201_initial_schema.sql
-- Removed RLS policies and changed auth.users references to users table

-- Avatar Library
CREATE TABLE IF NOT EXISTS avatar_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  category text,
  tags text[] DEFAULT '{}',
  is_premium boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Child Profiles
CREATE TABLE IF NOT EXISTS child_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 1 AND age <= 18),
  avatar_id uuid REFERENCES avatar_library(id),
  interests text[] DEFAULT '{}',
  learning_style text,
  pin_hash text,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  theme text,
  mood text,
  "values" text[] DEFAULT '{}',
  word_count integer,
  illustration_style text,
  illustration_url text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Family Members
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship text NOT NULL,
  birth_date text,
  notes text,
  is_alive boolean DEFAULT true,
  photo_url text,
  occupation text,
  hobbies text[] DEFAULT '{}',
  fun_facts text,
  connection_description text,
  photo_description text,
  generation_level integer,
  position_x float,
  position_y float,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Family Relationships
CREATE TABLE IF NOT EXISTS family_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  member1_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  member2_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  relationship_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member1_id, member2_id)
);

-- Journeys
CREATE TABLE IF NOT EXISTS journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  template_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Journey Steps
CREATE TABLE IF NOT EXISTS journey_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  step_order integer NOT NULL,
  content jsonb DEFAULT '{}',
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Guardrail Settings
CREATE TABLE IF NOT EXISTS guardrail_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  max_session_time integer DEFAULT 30,
  break_interval integer DEFAULT 15,
  content_filters jsonb DEFAULT '{}',
  allowed_topics text[] DEFAULT '{}',
  blocked_topics text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat Sessions (legacy, kept for compatibility)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat Messages (legacy, kept for compatibility)
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  safety_level text DEFAULT 'green' CHECK (safety_level IN ('green', 'yellow', 'red')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium')),
  stories_limit integer DEFAULT 10,
  stories_used integer DEFAULT 0,
  chat_messages_limit integer DEFAULT 100,
  chat_messages_used integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_child_profiles_user_id ON child_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_child_profile_id ON stories(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_child_profile_id ON journeys(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey_id ON journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_guardrail_settings_child_profile_id ON guardrail_settings(child_profile_id);

-- Triggers for updated_at
CREATE TRIGGER update_child_profiles_updated_at
  BEFORE UPDATE ON child_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journey_steps_updated_at
  BEFORE UPDATE ON journey_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardrail_settings_updated_at
  BEFORE UPDATE ON guardrail_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
