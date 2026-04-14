-- Default personality traits for new Luno buddies: all traits at 5/10
-- Also backfill any existing buddies that have empty personality_traits.

-- 1. Update the column default so new rows get sensible defaults
ALTER TABLE chat_buddies
  ALTER COLUMN personality_traits
  SET DEFAULT '{"curious":5,"patient":5,"playful":5,"educational":5,"empathetic":5}'::jsonb;

-- 2. Backfill existing buddies where personality_traits is empty object or null
UPDATE chat_buddies
SET personality_traits = '{"curious":5,"patient":5,"playful":5,"educational":5,"empathetic":5}'::jsonb
WHERE personality_traits IS NULL
   OR personality_traits = '{}'::jsonb;

-- 3. Update the trigger function that auto-creates buddies for new children
CREATE OR REPLACE FUNCTION create_buddy_for_child()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_buddies (child_profile_id, name, personality_traits)
  VALUES (NEW.id, 'Luno', '{"curious":5,"patient":5,"playful":5,"educational":5,"empathetic":5}'::jsonb)
  ON CONFLICT (child_profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
