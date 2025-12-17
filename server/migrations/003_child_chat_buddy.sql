-- Child Chat Buddy system
-- Adapted from Supabase migration 20231215_child_chat_buddy.sql

-- Chat Buddies
CREATE TABLE IF NOT EXISTS chat_buddies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Buddy',
  personality_traits jsonb DEFAULT '{}',
  conversation_context text,
  learned_preferences jsonb DEFAULT '{}',
  message_count integer DEFAULT 0,
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Buddy Messages
CREATE TABLE IF NOT EXISTS buddy_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('child', 'buddy', 'system')),
  content text NOT NULL,
  safety_level text NOT NULL DEFAULT 'green' CHECK (safety_level IN ('green', 'yellow', 'red')),
  safety_flags jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Safety Reports
CREATE TABLE IF NOT EXISTS safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES buddy_messages(id) ON DELETE SET NULL,
  severity text NOT NULL CHECK (severity IN ('yellow', 'red')),
  issue_summary text NOT NULL,
  full_context jsonb DEFAULT '{}',
  reviewed boolean DEFAULT false,
  parent_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Buddy Personality Suggestions
CREATE TABLE IF NOT EXISTS buddy_personality_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_id uuid REFERENCES chat_buddies(id) ON DELETE CASCADE NOT NULL,
  suggestion_type text NOT NULL,
  suggestion_content jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_buddies_child_profile_id ON chat_buddies(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_child_profile_id ON buddy_messages(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_created_at ON buddy_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_safety_level ON buddy_messages(safety_level);
CREATE INDEX IF NOT EXISTS idx_safety_reports_user_id ON safety_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_child_profile_id ON safety_reports(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_reviewed ON safety_reports(reviewed);

-- Triggers
CREATE TRIGGER update_chat_buddies_updated_at
  BEFORE UPDATE ON chat_buddies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_reports_updated_at
  BEFORE UPDATE ON safety_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buddy_personality_suggestions_updated_at
  BEFORE UPDATE ON buddy_personality_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create buddy when child profile is created
CREATE OR REPLACE FUNCTION create_buddy_for_child()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_buddies (child_profile_id, name)
  VALUES (NEW.id, 'Buddy')
  ON CONFLICT (child_profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_buddy_on_child_profile
  AFTER INSERT ON child_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_buddy_for_child();
