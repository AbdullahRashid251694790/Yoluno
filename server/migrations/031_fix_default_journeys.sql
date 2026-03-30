-- Migration 031: Fix default journeys — only 4 auto-assigned to children
-- Add is_auto_assign column, add new parent-only templates, clean up backfill

-- Add auto-assign flag
ALTER TABLE journey_templates ADD COLUMN IF NOT EXISTS is_auto_assign BOOLEAN DEFAULT false;

-- Set ONLY these 4 as auto-assign
UPDATE journey_templates SET is_auto_assign = true WHERE title IN (
  'Brush Your Teeth Champion',
  'Morning Routine Master',
  'Bedtime Hero',
  'Be Kind Today'
);

-- Un-feature the ones that were auto-assigned but shouldn't be
UPDATE journey_templates SET is_featured = false WHERE title IN (
  'Brush Your Teeth Champion',
  'Bedtime Hero',
  'Be Kind Today'
);
-- Keep My Feelings Journal, Creative Explorer, Reading Adventure, Kindness Quest as featured (parent browsable) but NOT auto-assign

-- Remove auto-assigned journeys that should NOT have been assigned (keep only the 4 defaults)
-- First remove steps, then journeys
DELETE FROM journey_steps WHERE journey_id IN (
  SELECT j.id FROM journeys j
  JOIN journey_templates jt ON jt.id::text = j.template_id::text
  WHERE jt.is_auto_assign = false
    AND j.progress = 0
    AND j.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM journey_steps js WHERE js.journey_id::text = j.id::text AND js.completed_at IS NOT NULL)
);

DELETE FROM journeys WHERE id IN (
  SELECT j.id FROM journeys j
  JOIN journey_templates jt ON jt.id::text = j.template_id::text
  WHERE jt.is_auto_assign = false
    AND j.progress = 0
    AND j.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM journey_steps js WHERE js.journey_id::text = j.id::text AND js.completed_at IS NOT NULL)
);

-- Add new parent-only templates

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'Exercise Champion', 'Get moving every day! Run, jump, stretch, and play your way to a healthy body.', 'health', 3, 12, 7, 'easy', true, false, '🏃'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Exercise Champion');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'Tidy Up Star', 'Learn to keep your space clean and organized. A tidy room makes a happy you!', 'habit', 3, 8, 5, 'easy', true, false, '🧹'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Tidy Up Star');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'Story Writer', 'Create your own stories! Learn to imagine characters, build worlds, and write adventures.', 'creativity', 5, 12, 10, 'medium', true, false, '📖'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Story Writer');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'World Explorer', 'Travel the world from your room! Discover countries, cultures, and amazing places.', 'learning', 5, 12, 10, 'medium', true, false, '🌍'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'World Explorer');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'Music Maker', 'Explore the world of music! Clap rhythms, sing songs, and discover instruments.', 'creativity', 3, 12, 7, 'easy', true, false, '🎵'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Music Maker');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'Math Adventurer', 'Numbers are fun! Count, add, spot patterns, and solve puzzles on this math quest.', 'learning', 4, 10, 7, 'easy', true, false, '🧮'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Math Adventurer');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'Plant a Seed', 'Watch something grow! Learn about plants, nature, and caring for living things.', 'learning', 3, 10, 14, 'easy', true, false, '🌱'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Plant a Seed');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, is_auto_assign, badge_emoji)
SELECT 'Friendship Builder', 'Learn what makes a great friend. Share, listen, play fair, and be there for others.', 'social', 4, 12, 7, 'easy', true, false, '🤗'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Friendship Builder');

-- Add steps for new templates
DO $$
DECLARE
  t_id uuid;
BEGIN
  -- Exercise Champion
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Exercise Champion';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Stretch It Out', 'Start with 5 minutes of stretching. Reach for the sky and touch your toes!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Jump Around', 'Do 20 jumping jacks or jump rope for 2 minutes. Feel your heart beat!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Go Outside', 'Play outside for 15 minutes. Run, ride a bike, or play a game.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Dance Party', 'Put on your favorite song and dance for the whole thing!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 5, 'Exercise Champion', 'You moved your body every day this week! You are an Exercise Champion!', 'milestone', '{}');
  END IF;

  -- Tidy Up Star
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Tidy Up Star';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Make Your Bed', 'Start the day by making your bed. Pull up the covers nice and neat!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Toy Cleanup', 'Put all your toys back where they belong before dinner.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Help with Dishes', 'Help clear the table or put dishes in the sink after a meal.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Organize Your Space', 'Pick one shelf or drawer and organize it. Group similar things together.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 5, 'Tidy Up Star', 'Your space is sparkling clean! You are a Tidy Up Star!', 'milestone', '{}');
  END IF;

  -- Story Writer
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Story Writer';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Create a Character', 'Think of a character for your story. What do they look like? What do they love?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Build a World', 'Where does your story take place? A castle, a forest, space? Draw it!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'The Problem', 'Every good story has a challenge. What problem does your character face?', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 4, 'Write the Story', 'Put it all together! Write or tell your story from beginning to end.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 5, 'Story Writer', 'You created a whole story! You are an amazing Story Writer!', 'milestone', '{}');
  END IF;

  -- World Explorer
  SELECT id INTO t_id FROM journey_templates WHERE title = 'World Explorer';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Pick a Country', 'Choose a country you want to learn about. Find it on a map!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'What Do They Eat?', 'Find out what people eat in that country. Would you try it?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Say Hello', 'Learn how to say hello in that country''s language. Practice it!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Draw a Landmark', 'Draw a famous place from that country. The Eiffel Tower? The Great Wall?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 5, 'World Explorer', 'You explored a whole country! You are a World Explorer!', 'milestone', '{}');
  END IF;

  -- Music Maker
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Music Maker';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Clap a Beat', 'Clap your hands to create a rhythm. Can you make a pattern?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Sing a Song', 'Sing your favorite song out loud. Do not worry about being perfect!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Kitchen Band', 'Use pots, spoons, and cups to make instruments. Play a song!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Listen and Feel', 'Listen to a new song. How does it make you feel? Happy? Calm? Excited?', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 5, 'Music Maker', 'You explored music all week! You are a Music Maker!', 'milestone', '{}');
  END IF;

  -- Math Adventurer
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Math Adventurer';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Count Everything', 'Count the things around you — chairs, books, windows. How many?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Shape Hunt', 'Find circles, squares, and triangles around your house. How many can you spot?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Pattern Maker', 'Create a pattern with toys or drawings. Red, blue, red, blue... what comes next?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Add It Up', 'Use snacks or toys to practice adding. 3 grapes plus 2 grapes equals?', 'activity', '{}'),
      (gen_random_uuid(), t_id, 5, 'Math Adventurer', 'You conquered math challenges all week! You are a Math Adventurer!', 'milestone', '{}');
  END IF;

  -- Plant a Seed
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Plant a Seed';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Choose Your Seed', 'Pick a seed to plant — a bean, sunflower, or herb. Get a small pot and soil.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Plant It', 'Put soil in the pot, make a small hole, drop the seed in, and cover it. Water gently!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Water and Wait', 'Water your plant a little every day. Put it near sunlight. Be patient!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Watch It Grow', 'Check your plant. Do you see a sprout? Draw what it looks like today.', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 5, 'Plant Parent', 'You grew a plant from a tiny seed! You are a Plant Parent!', 'milestone', '{}');
  END IF;

  -- Friendship Builder
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Friendship Builder';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Say Hi First', 'Say hello to someone new today. A smile goes a long way!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Listen Carefully', 'When a friend talks, really listen. Ask them a question about what they said.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Play Together', 'Invite someone to play. Let them choose the game this time.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Be There', 'If a friend is sad, ask how they feel. Sometimes just being there helps.', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 5, 'Friendship Builder', 'You practiced being an amazing friend all week! You are a Friendship Builder!', 'milestone', '{}');
  END IF;
END $$;

-- Re-run auto-assign for ONLY the 4 default journeys to all existing children
INSERT INTO journeys (id, child_profile_id, template_id, title, status, progress, badge_emoji)
SELECT gen_random_uuid(), cp.id, jt.id, jt.title, 'active', 0, COALESCE(jt.badge_emoji, '🏅')
FROM child_profiles cp
CROSS JOIN journey_templates jt
WHERE jt.is_auto_assign = true
  AND jt.age_range_min <= cp.age
  AND jt.age_range_max >= cp.age
  AND NOT EXISTS (
    SELECT 1 FROM journeys j
    WHERE j.child_profile_id = cp.id AND j.template_id::text = jt.id::text
  );

-- Copy steps for newly created default journeys
INSERT INTO journey_steps (id, journey_id, step_order, title, description, type, content, progress)
SELECT gen_random_uuid(), j.id, jts.step_order, jts.title, jts.description, jts.type, jts.content, 0
FROM journeys j
JOIN journey_template_steps jts ON jts.template_id::text = j.template_id::text
WHERE j.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM journey_steps js
    WHERE js.journey_id::text = j.id::text AND js.step_order = jts.step_order
  );
