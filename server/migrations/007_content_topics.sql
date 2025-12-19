-- Migration 007: Content & Topics Management
-- Topic categories, topics library, and saved content items

-- Topic Categories (for organizing topics)
CREATE TABLE IF NOT EXISTS topic_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Topics Library (all available topics)
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES topic_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  age_appropriate_min integer NOT NULL DEFAULT 3,
  age_appropriate_max integer NOT NULL DEFAULT 12,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Child Topic Settings (per-child topic configuration)
CREATE TABLE IF NOT EXISTS child_topic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  is_allowed boolean DEFAULT true,
  is_blocked boolean DEFAULT false,
  parent_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_profile_id, topic_id)
);

-- Saved Content Items (parent-saved content for later)
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE SET NULL,
  content_type text NOT NULL CHECK (content_type IN ('story', 'chat_snippet', 'journey', 'note', 'favorite')),
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_topic_categories_order ON topic_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_age ON topics(age_appropriate_min, age_appropriate_max);
CREATE INDEX IF NOT EXISTS idx_child_topic_settings_child ON child_topic_settings(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_content_items_user ON content_items(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_child ON content_items(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_favorite ON content_items(is_favorite) WHERE is_favorite = true;

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_child_topic_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_child_topic_settings_updated_at ON child_topic_settings;
CREATE TRIGGER update_child_topic_settings_updated_at
  BEFORE UPDATE ON child_topic_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_child_topic_settings_updated_at();

CREATE OR REPLACE FUNCTION update_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_items_updated_at();

-- Seed topic categories
INSERT INTO topic_categories (name, description, icon, color, sort_order) VALUES
  ('Animals & Nature', 'Animals, plants, weather, and the natural world', 'leaf', '#4CAF50', 1),
  ('Science & Space', 'Scientific concepts, experiments, and space exploration', 'flask', '#2196F3', 2),
  ('History & Culture', 'Historical events, different cultures, and traditions', 'book', '#9C27B0', 3),
  ('Arts & Creativity', 'Art, music, crafts, and creative expression', 'palette', '#FF9800', 4),
  ('Emotions & Feelings', 'Understanding and managing emotions', 'heart', '#E91E63', 5),
  ('Family & Friends', 'Relationships, family, and social skills', 'users', '#00BCD4', 6),
  ('Health & Body', 'Body, health, nutrition, and wellness', 'activity', '#8BC34A', 7),
  ('Adventure & Fantasy', 'Imaginative adventures, dragons, and magical worlds', 'sparkles', '#673AB7', 8)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Seed some default topics
DO $$
DECLARE
  cat_animals uuid;
  cat_science uuid;
  cat_emotions uuid;
  cat_fantasy uuid;
BEGIN
  SELECT id INTO cat_animals FROM topic_categories WHERE name = 'Animals & Nature';
  SELECT id INTO cat_science FROM topic_categories WHERE name = 'Science & Space';
  SELECT id INTO cat_emotions FROM topic_categories WHERE name = 'Emotions & Feelings';
  SELECT id INTO cat_fantasy FROM topic_categories WHERE name = 'Adventure & Fantasy';

  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    -- Animals & Nature
    (cat_animals, 'Dinosaurs', 'Learn about prehistoric creatures', 3, 12, true),
    (cat_animals, 'Ocean Animals', 'Explore sea life and marine creatures', 3, 12, true),
    (cat_animals, 'Pets', 'Dogs, cats, and caring for animals', 3, 12, true),
    (cat_animals, 'Weather', 'Rain, sun, clouds, and seasons', 3, 10, true),

    -- Science & Space
    (cat_science, 'Space', 'Planets, stars, and astronauts', 4, 12, true),
    (cat_science, 'Robots', 'How robots work and what they do', 5, 12, true),
    (cat_science, 'Experiments', 'Fun science experiments', 5, 12, true),

    -- Emotions & Feelings
    (cat_emotions, 'Feeling Happy', 'Joy, excitement, and celebration', 3, 12, true),
    (cat_emotions, 'Feeling Scared', 'Understanding and managing fear', 3, 12, true),
    (cat_emotions, 'Making Friends', 'Friendship and social skills', 3, 12, true),
    (cat_emotions, 'Being Brave', 'Courage and trying new things', 3, 12, true),

    -- Adventure & Fantasy
    (cat_fantasy, 'Dragons', 'Friendly dragons and magical creatures', 3, 12, true),
    (cat_fantasy, 'Superheroes', 'Heroes, powers, and saving the day', 4, 12, true),
    (cat_fantasy, 'Fairy Tales', 'Classic stories and magical adventures', 3, 10, true)
  ON CONFLICT DO NOTHING;
END $$;
