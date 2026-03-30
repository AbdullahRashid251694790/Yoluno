-- Migration 030: Add more featured journey templates and auto-assign to existing children

-- Add new templates one by one with explicit conflict handling on title
INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, badge_emoji)
SELECT 'Brush Your Teeth Champion', 'Learn to brush your teeth like a pro! Morning and night, keep those teeth shiny and bright.', 'habit', 3, 8, 7, 'easy', true, '🪥'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Brush Your Teeth Champion');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, badge_emoji)
SELECT 'Be Kind Today', 'Spread kindness every day! Small acts of kindness make the world a better place.', 'social', 3, 10, 5, 'easy', true, '💝'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Be Kind Today');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, badge_emoji)
SELECT 'Bedtime Hero', 'Build an awesome bedtime routine! Brush teeth, read a story, and sleep tight.', 'habit', 3, 8, 7, 'easy', true, '🌙'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'Bedtime Hero');

INSERT INTO journey_templates (title, description, category, age_range_min, age_range_max, duration_days, difficulty, is_featured, badge_emoji)
SELECT 'My Feelings Journal', 'Learn to understand and express your feelings. Every feeling is okay!', 'health', 4, 12, 7, 'easy', true, '📔'
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE title = 'My Feelings Journal');

-- Add steps for new templates
DO $$
DECLARE
  t_id uuid;
BEGIN
  -- Steps for Brush Your Teeth Champion
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Brush Your Teeth Champion';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Why We Brush', 'Learn why brushing teeth is important for keeping them healthy and strong!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Morning Brush', 'Brush your teeth after breakfast. Set a timer for 2 minutes!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Night Brush', 'Brush your teeth before bed tonight. Do not forget the back ones!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Brush for 3 Days', 'Keep brushing morning and night for 3 days in a row!', 'milestone', '{}'),
      (gen_random_uuid(), t_id, 5, 'Tooth Champion', 'You did it! You are now a Tooth Champion with sparkling clean teeth!', 'milestone', '{}');
  END IF;

  -- Steps for Be Kind Today
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Be Kind Today';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Say Something Nice', 'Tell someone in your family something nice about them today.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Help Out', 'Help someone with a task today — set the table, tidy up, or carry something.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Share Something', 'Share a toy, snack, or game with a friend or sibling today.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Draw a Thank You', 'Draw a picture or write a note to thank someone who helped you.', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 5, 'Kindness Star', 'You completed 5 acts of kindness! You are a Kindness Star!', 'milestone', '{}');
  END IF;

  -- Steps for Bedtime Hero
  SELECT id INTO t_id FROM journey_templates WHERE title = 'Bedtime Hero';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Tidy Up Time', 'Put your toys away before bedtime. Everything has a home!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 2, 'Brush and Wash', 'Brush your teeth and wash your face. Squeaky clean!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Story Time', 'Read a story or have someone read to you before bed.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Lights Out', 'Get into bed, close your eyes, and think of something happy.', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 5, 'Bedtime Hero', 'You followed your bedtime routine all week! Sweet dreams, hero!', 'milestone', '{}');
  END IF;

  -- Steps for My Feelings Journal
  SELECT id INTO t_id FROM journey_templates WHERE title = 'My Feelings Journal';
  IF t_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = t_id) THEN
    INSERT INTO journey_template_steps (id, template_id, step_order, title, description, type, content) VALUES
      (gen_random_uuid(), t_id, 1, 'Name Your Feeling', 'How do you feel right now? Happy, sad, excited, worried? Name it!', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 2, 'Draw Your Feeling', 'Draw a picture of how you feel today. Use any colors you like!', 'activity', '{}'),
      (gen_random_uuid(), t_id, 3, 'Calm Down Move', 'Learn a calming trick: take 5 deep breaths, slow and steady.', 'activity', '{}'),
      (gen_random_uuid(), t_id, 4, 'Talk About It', 'Tell someone you trust about a feeling you had today.', 'reflection', '{}'),
      (gen_random_uuid(), t_id, 5, 'Feelings Expert', 'You explored your feelings for a whole week! You are a Feelings Expert!', 'milestone', '{}');
  END IF;
END $$;

-- Auto-assign featured journeys to all existing children who don't have them
INSERT INTO journeys (id, child_profile_id, template_id, title, status, progress, badge_emoji)
SELECT gen_random_uuid(), cp.id, jt.id, jt.title, 'active', 0, COALESCE(jt.badge_emoji, '🏅')
FROM child_profiles cp
CROSS JOIN journey_templates jt
WHERE jt.is_featured = true
  AND jt.age_range_min <= cp.age
  AND jt.age_range_max >= cp.age
  AND NOT EXISTS (
    SELECT 1 FROM journeys j
    WHERE j.child_profile_id = cp.id AND j.template_id::text = jt.id::text
  );

-- Copy steps for newly created journeys that have no steps yet
INSERT INTO journey_steps (id, journey_id, step_order, title, description, type, content, progress)
SELECT gen_random_uuid(), j.id, jts.step_order, jts.title, jts.description, jts.type, jts.content, 0
FROM journeys j
JOIN journey_template_steps jts ON jts.template_id::text = j.template_id::text
WHERE j.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM journey_steps js
    WHERE js.journey_id::text = j.id::text AND js.step_order = jts.step_order
  );
