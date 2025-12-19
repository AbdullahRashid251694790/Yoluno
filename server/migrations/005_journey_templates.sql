-- Migration 005: Journey Templates
-- Templates for the journey marketplace

-- Journey Templates (blueprints for creating journeys)
CREATE TABLE IF NOT EXISTS journey_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('habit', 'learning', 'social', 'health', 'creativity')),
  age_range_min integer NOT NULL DEFAULT 3,
  age_range_max integer NOT NULL DEFAULT 12,
  duration_days integer NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  icon text,
  color text,
  is_featured boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Template Steps (blueprint for journey steps)
CREATE TABLE IF NOT EXISTS journey_template_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES journey_templates(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('activity', 'reflection', 'milestone')),
  content jsonb DEFAULT '{}',
  estimated_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journey_templates_category ON journey_templates(category);
CREATE INDEX IF NOT EXISTS idx_journey_templates_featured ON journey_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_journey_templates_age ON journey_templates(age_range_min, age_range_max);
CREATE INDEX IF NOT EXISTS idx_journey_template_steps_template ON journey_template_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_journey_template_steps_order ON journey_template_steps(template_id, step_order);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_journey_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_journey_template_updated_at ON journey_templates;
CREATE TRIGGER update_journey_template_updated_at
  BEFORE UPDATE ON journey_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_template_updated_at();

-- Seed some default journey templates
INSERT INTO journey_templates (title, description, category, duration_days, difficulty, icon, color, is_featured) VALUES
  ('Morning Routine Master', 'Build a healthy morning routine with daily habits', 'habit', 7, 'easy', 'sun', '#FFA500', true),
  ('Kindness Quest', 'Learn to spread kindness through daily acts', 'social', 5, 'easy', 'heart', '#FF69B4', true),
  ('Reading Adventure', 'Develop a love for reading with daily reading challenges', 'learning', 14, 'medium', 'book-open', '#4169E1', true),
  ('Healthy Body', 'Learn about nutrition and exercise through fun activities', 'health', 7, 'easy', 'activity', '#32CD32', false),
  ('Creative Explorer', 'Unlock your creativity with art and imagination exercises', 'creativity', 10, 'medium', 'palette', '#9370DB', true),
  ('Gratitude Garden', 'Grow happiness by practicing daily gratitude', 'social', 7, 'easy', 'flower', '#FFD700', false),
  ('Science Discovery', 'Explore the wonders of science with experiments', 'learning', 10, 'medium', 'flask', '#00CED1', false),
  ('Mindfulness Journey', 'Learn to be calm and present with breathing exercises', 'health', 7, 'easy', 'wind', '#87CEEB', false)
ON CONFLICT DO NOTHING;

-- Insert template steps for 'Morning Routine Master'
DO $$
DECLARE
  template_id uuid;
BEGIN
  SELECT id INTO template_id FROM journey_templates WHERE title = 'Morning Routine Master' LIMIT 1;

  IF template_id IS NOT NULL THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (template_id, 1, 'Wake Up Warrior', 'Set your alarm and wake up at the same time', 'activity', '{"tip": "Put your alarm across the room so you have to get up!"}', 5),
      (template_id, 2, 'Stretch and Shine', 'Do 5 minutes of morning stretches', 'activity', '{"exercises": ["arm circles", "toe touches", "jumping jacks"]}', 5),
      (template_id, 3, 'Reflection Day 2', 'How did you feel waking up today?', 'reflection', '{"prompt": "Did you feel more energized?"}', 5),
      (template_id, 4, 'Breakfast Champion', 'Eat a healthy breakfast before starting your day', 'activity', '{"tip": "Include protein and fruit!"}', 15),
      (template_id, 5, 'Mid-Week Check', 'You are halfway there!', 'milestone', '{"celebration": "confetti"}', 2),
      (template_id, 6, 'Make Your Bed', 'Start the day with a tidy room', 'activity', '{"tip": "A made bed starts your day right!"}', 3),
      (template_id, 7, 'Routine Master!', 'You completed the morning routine journey!', 'milestone', '{"celebration": "badge", "badge": "morning_master"}', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert template steps for 'Kindness Quest'
DO $$
DECLARE
  template_id uuid;
BEGIN
  SELECT id INTO template_id FROM journey_templates WHERE title = 'Kindness Quest' LIMIT 1;

  IF template_id IS NOT NULL THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (template_id, 1, 'Compliment Day', 'Give 3 genuine compliments today', 'activity', '{"tip": "Be specific about what you appreciate"}', 10),
      (template_id, 2, 'Helper Hero', 'Help someone without being asked', 'activity', '{"examples": ["clean up", "carry something", "share"]}', 15),
      (template_id, 3, 'Kindness Reflection', 'How did it feel to be kind?', 'reflection', '{"prompt": "What was the best reaction you got?"}', 5),
      (template_id, 4, 'Thank You Note', 'Write a thank you note to someone special', 'activity', '{"tip": "Handwritten notes are extra special!"}', 15),
      (template_id, 5, 'Kindness Champion!', 'You spread kindness for a whole week!', 'milestone', '{"celebration": "confetti"}', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
