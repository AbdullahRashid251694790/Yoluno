-- Migration 004: Gamification System
-- Badges, streaks, points, and activity tracking

-- Activity Types (defines point values for each activity - NO hardcoding)
CREATE TABLE IF NOT EXISTS activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  points_value integer NOT NULL DEFAULT 0,
  icon_name text,
  category text NOT NULL CHECK (category IN ('chat', 'story', 'journey', 'learning', 'social')),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Child Activities Log (records every activity for points tracking)
CREATE TABLE IF NOT EXISTS child_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type_id uuid REFERENCES activity_types(id) ON DELETE RESTRICT NOT NULL,
  points_earned integer NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Child Stats (aggregate stats per child - auto-created via trigger)
CREATE TABLE IF NOT EXISTS child_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  total_activities integer NOT NULL DEFAULT 0,
  total_stories integer NOT NULL DEFAULT 0,
  total_journeys_completed integer NOT NULL DEFAULT 0,
  total_chat_messages integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Badge Definitions (master list of all possible badges)
CREATE TABLE IF NOT EXISTS badge_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('streak', 'learning', 'story', 'journey', 'special')),
  icon_url text NOT NULL,
  requirement_type text NOT NULL CHECK (requirement_type IN ('streak', 'points', 'activity_count', 'specific_action')),
  requirement_value integer NOT NULL,
  requirement_metadata jsonb DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Badges Earned (junction table for child-badge relationship)
CREATE TABLE IF NOT EXISTS badges_earned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  badge_definition_id uuid REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  notified boolean DEFAULT false,
  UNIQUE(child_profile_id, badge_definition_id)
);

-- Streak History (track daily activity for streak calculation)
CREATE TABLE IF NOT EXISTS streak_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  activity_date date NOT NULL,
  activity_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_profile_id, activity_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_child_activities_child_id ON child_activities(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_child_activities_created_at ON child_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_activities_type ON child_activities(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_child_stats_child_id ON child_stats(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_badges_earned_child_id ON badges_earned(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_badges_earned_notified ON badges_earned(notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_streak_history_child_date ON streak_history(child_profile_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON badge_definitions(category);

-- Updated at trigger for child_stats
CREATE OR REPLACE FUNCTION update_child_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_child_stats_updated_at ON child_stats;
CREATE TRIGGER update_child_stats_updated_at
  BEFORE UPDATE ON child_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_child_stats_updated_at();

-- Function to auto-create child_stats when child profile is created
CREATE OR REPLACE FUNCTION create_stats_for_child()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO child_stats (child_profile_id)
  VALUES (NEW.id)
  ON CONFLICT (child_profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_stats_on_child_profile ON child_profiles;
CREATE TRIGGER create_stats_on_child_profile
  AFTER INSERT ON child_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_stats_for_child();

-- Create stats for existing child profiles
INSERT INTO child_stats (child_profile_id)
SELECT id FROM child_profiles
ON CONFLICT (child_profile_id) DO NOTHING;

-- Seed initial activity types (values from database, not hardcoded in code)
INSERT INTO activity_types (name, display_name, description, points_value, icon_name, category) VALUES
  ('chat_message_sent', 'Chat Message', 'Sent a message to buddy', 1, 'message-circle', 'chat'),
  ('story_created', 'Story Created', 'Created a new story', 10, 'book-open', 'story'),
  ('story_read', 'Story Read', 'Read a story', 5, 'book', 'story'),
  ('journey_started', 'Journey Started', 'Started a new learning journey', 5, 'map', 'journey'),
  ('journey_step_completed', 'Step Completed', 'Completed a journey step', 3, 'check-circle', 'journey'),
  ('journey_completed', 'Journey Completed', 'Completed an entire journey', 25, 'trophy', 'journey'),
  ('daily_login', 'Daily Visit', 'Visited the app today', 2, 'calendar', 'social'),
  ('family_explored', 'Family Explorer', 'Viewed family tree', 3, 'users', 'social')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  points_value = EXCLUDED.points_value,
  icon_name = EXCLUDED.icon_name,
  category = EXCLUDED.category;

-- Seed initial badge definitions
INSERT INTO badge_definitions (name, display_name, description, category, icon_url, requirement_type, requirement_value, sort_order) VALUES
  -- Learning badges
  ('first_chat', 'First Chat', 'Started your first conversation with Luno!', 'learning', '/badges/first-chat.svg', 'activity_count', 1, 1),
  ('chat_explorer', 'Chat Explorer', 'Sent 50 messages to Luno', 'learning', '/badges/chat-explorer.svg', 'activity_count', 50, 2),
  ('chat_master', 'Chat Master', 'Sent 500 messages to Luno', 'learning', '/badges/chat-master.svg', 'activity_count', 500, 3),

  -- Story badges
  ('storyteller', 'Storyteller', 'Created your first story!', 'story', '/badges/storyteller.svg', 'activity_count', 1, 10),
  ('story_collector', 'Story Collector', 'Created 10 stories', 'story', '/badges/story-collector.svg', 'activity_count', 10, 11),
  ('story_master', 'Story Master', 'Created 50 stories', 'story', '/badges/story-master.svg', 'activity_count', 50, 12),

  -- Journey badges
  ('journey_starter', 'Journey Starter', 'Started your first learning journey!', 'journey', '/badges/journey-starter.svg', 'activity_count', 1, 20),
  ('journey_finisher', 'Journey Finisher', 'Completed your first learning journey!', 'journey', '/badges/journey-finisher.svg', 'activity_count', 1, 21),
  ('journey_explorer', 'Journey Explorer', 'Completed 5 learning journeys', 'journey', '/badges/journey-explorer.svg', 'activity_count', 5, 22),

  -- Streak badges
  ('streak_3', '3 Day Streak', 'Active for 3 days in a row!', 'streak', '/badges/streak-3.svg', 'streak', 3, 30),
  ('streak_7', 'Week Warrior', 'Active for 7 days in a row!', 'streak', '/badges/streak-7.svg', 'streak', 7, 31),
  ('streak_14', 'Two Week Champion', 'Active for 14 days in a row!', 'streak', '/badges/streak-14.svg', 'streak', 14, 32),
  ('streak_30', 'Monthly Master', 'Active for 30 days in a row!', 'streak', '/badges/streak-30.svg', 'streak', 30, 33),

  -- Points badges
  ('points_100', 'Rising Star', 'Earned 100 points', 'special', '/badges/rising-star.svg', 'points', 100, 40),
  ('points_500', 'Super Star', 'Earned 500 points', 'special', '/badges/super-star.svg', 'points', 500, 41),
  ('points_1000', 'Mega Star', 'Earned 1000 points', 'special', '/badges/mega-star.svg', 'points', 1000, 42),
  ('points_5000', 'Legend', 'Earned 5000 points', 'special', '/badges/legend.svg', 'points', 5000, 43)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_url = EXCLUDED.icon_url,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  sort_order = EXCLUDED.sort_order;
