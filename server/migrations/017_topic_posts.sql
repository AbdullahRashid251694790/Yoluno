-- Migration 017: Topic Posts
-- Custom topics and topic posts for personalized AI conversations

-- Custom Topics (parent-created topics for a child)
CREATE TABLE IF NOT EXISTS custom_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_profile_id, name)
);

-- Topic Posts (content entries for topics - either system or custom)
CREATE TABLE IF NOT EXISTS topic_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  custom_topic_id uuid REFERENCES custom_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Ensure exactly one of topic_id or custom_topic_id is set
  CONSTRAINT topic_posts_one_topic_type CHECK (
    (topic_id IS NOT NULL AND custom_topic_id IS NULL) OR
    (topic_id IS NULL AND custom_topic_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_topics_child ON custom_topics(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_topics_active ON custom_topics(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_topic_posts_child ON topic_posts(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_topic_posts_topic ON topic_posts(topic_id) WHERE topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_topic_posts_custom_topic ON topic_posts(custom_topic_id) WHERE custom_topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_topic_posts_active ON topic_posts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_topic_posts_sort ON topic_posts(sort_order);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_custom_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_topics_updated_at ON custom_topics;
CREATE TRIGGER update_custom_topics_updated_at
  BEFORE UPDATE ON custom_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_topics_updated_at();

CREATE OR REPLACE FUNCTION update_topic_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_topic_posts_updated_at ON topic_posts;
CREATE TRIGGER update_topic_posts_updated_at
  BEFORE UPDATE ON topic_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_posts_updated_at();
