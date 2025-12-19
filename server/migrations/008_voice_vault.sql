-- Migration 008: Voice Vault
-- Voice clip storage and management

-- Voice Clips
CREATE TABLE IF NOT EXISTS voice_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE SET NULL,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('encouragement', 'praise', 'celebration', 'story', 'memory', 'greeting', 'other')),
  audio_url text NOT NULL,
  duration_seconds integer NOT NULL,
  file_size_bytes integer,
  transcription text,
  is_favorite boolean DEFAULT false,
  play_count integer DEFAULT 0,
  last_played_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Voice Clip Tags (for organization)
CREATE TABLE IF NOT EXISTS voice_clip_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_clip_id uuid REFERENCES voice_clips(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  UNIQUE(voice_clip_id, tag)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_clips_user ON voice_clips(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_clips_child ON voice_clips(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_clips_family_member ON voice_clips(family_member_id);
CREATE INDEX IF NOT EXISTS idx_voice_clips_category ON voice_clips(category);
CREATE INDEX IF NOT EXISTS idx_voice_clips_favorite ON voice_clips(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_voice_clips_created ON voice_clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_clip_tags_clip ON voice_clip_tags(voice_clip_id);
CREATE INDEX IF NOT EXISTS idx_voice_clip_tags_tag ON voice_clip_tags(tag);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_voice_clips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_voice_clips_updated_at ON voice_clips;
CREATE TRIGGER update_voice_clips_updated_at
  BEFORE UPDATE ON voice_clips
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_clips_updated_at();

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_voice_clip_play_count(p_clip_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE voice_clips
  SET play_count = play_count + 1,
      last_played_at = now()
  WHERE id = p_clip_id;
END;
$$ LANGUAGE plpgsql;
