-- Migration 009: Kids Mode & Story Enhancements
-- Onboarding, mode configs, personality configs, story settings

-- Onboarding Progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  completed_at timestamptz,
  current_step text,
  steps_completed jsonb DEFAULT '[]',
  skipped boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Kids Mode Config (defines available modes - from database, not hardcoded)
CREATE TABLE IF NOT EXISTS kids_mode_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  icon_name text NOT NULL,
  color_class text NOT NULL,
  route_path text NOT NULL,
  is_enabled boolean DEFAULT true,
  display_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Personality Configs (Luno personalities - from database, not hardcoded)
CREATE TABLE IF NOT EXISTS personality_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL,
  prompt_style text NOT NULL,
  example_greeting text,
  is_enabled boolean DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Story Settings (per-child story preferences)
CREATE TABLE IF NOT EXISTS story_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bedtime_enabled boolean DEFAULT false,
  auto_play_stories boolean DEFAULT false,
  dim_level integer DEFAULT 50 CHECK (dim_level >= 0 AND dim_level <= 100),
  auto_advance_delay_seconds integer DEFAULT 3 CHECK (auto_advance_delay_seconds >= 1 AND auto_advance_delay_seconds <= 30),
  preferred_voice text DEFAULT 'nova',
  font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'xlarge')),
  show_illustrations boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Story Scenes (for scene-by-scene story display)
CREATE TABLE IF NOT EXISTS story_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  scene_order integer NOT NULL,
  content text NOT NULL,
  image_url text,
  image_prompt text,
  audio_url text,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_child ON onboarding_progress(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_completed ON onboarding_progress(completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kids_mode_config_order ON kids_mode_config(display_order);
CREATE INDEX IF NOT EXISTS idx_kids_mode_config_enabled ON kids_mode_config(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_personality_configs_order ON personality_configs(display_order);
CREATE INDEX IF NOT EXISTS idx_personality_configs_enabled ON personality_configs(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_story_settings_child ON story_settings(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_story_scenes_story ON story_scenes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_scenes_order ON story_scenes(story_id, scene_order);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

CREATE OR REPLACE FUNCTION update_story_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_story_settings_updated_at ON story_settings;
CREATE TRIGGER update_story_settings_updated_at
  BEFORE UPDATE ON story_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_story_settings_updated_at();

-- Seed kids mode configs (from database, not hardcoded in code)
INSERT INTO kids_mode_config (mode_key, label, description, icon_name, color_class, route_path, display_order) VALUES
  ('chat', 'Chat', 'Talk with Luno your AI buddy', 'message-circle', 'bg-blue-500', '/kids/:childId/chat', 1),
  ('stories', 'Stories', 'Read and create magical stories', 'book-open', 'bg-purple-500', '/kids/:childId/stories', 2),
  ('journeys', 'Journeys', 'Go on learning adventures', 'map', 'bg-green-500', '/kids/:childId/journeys', 3),
  ('learning', 'Learning', 'Explore and learn new things', 'graduation-cap', 'bg-orange-500', '/kids/:childId/learning', 4)
ON CONFLICT (mode_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  color_class = EXCLUDED.color_class,
  route_path = EXCLUDED.route_path,
  display_order = EXCLUDED.display_order;

-- Seed personality configs (from database, not hardcoded in code)
INSERT INTO personality_configs (mode_key, label, description, emoji, prompt_style, example_greeting, display_order) VALUES
  ('curious_explorer', 'Curious Explorer', 'Always asking questions and discovering new things together', '🔍', 'curious and inquisitive, asks follow-up questions, loves learning', 'Ooh, I wonder what we will discover today! What are you curious about?', 1),
  ('patient_teacher', 'Patient Teacher', 'Explains things clearly and encouragingly at your pace', '📚', 'educational and supportive, breaks down complex ideas, patient', 'I am here to help you learn! What would you like to understand better?', 2),
  ('playful_friend', 'Playful Friend', 'Fun, silly, and always ready to play and laugh', '🎮', 'playful and humorous, uses jokes, keeps things light and fun', 'Hey friend! Ready to have some fun? I have been practicing my jokes!', 3),
  ('storyteller', 'Storyteller', 'Weaves magical tales and takes you on adventures', '✨', 'narrative and imaginative, uses storytelling, creates vivid scenes', 'Once upon a time... just kidding! But I do have an amazing adventure for us today!', 4)
ON CONFLICT (mode_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  prompt_style = EXCLUDED.prompt_style,
  example_greeting = EXCLUDED.example_greeting,
  display_order = EXCLUDED.display_order;

-- Create story settings for existing children
INSERT INTO story_settings (child_profile_id)
SELECT id FROM child_profiles
ON CONFLICT (child_profile_id) DO NOTHING;

-- Create onboarding progress for existing children (mark as completed)
INSERT INTO onboarding_progress (child_profile_id, completed_at)
SELECT id, now() FROM child_profiles
ON CONFLICT (child_profile_id) DO NOTHING;
