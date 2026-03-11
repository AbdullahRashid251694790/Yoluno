-- Migration 025: Journey completion badges
-- Adds per-journey badge emojis and seeds badge definitions for each template.

-- Add badge_emoji to journey_templates
ALTER TABLE journey_templates ADD COLUMN IF NOT EXISTS badge_emoji TEXT NOT NULL DEFAULT '🏅';

-- Seed emojis for default templates
UPDATE journey_templates SET badge_emoji = '🌅' WHERE title ILIKE '%morning routine%' OR title ILIKE '%routine master%';
UPDATE journey_templates SET badge_emoji = '🤝' WHERE title ILIKE '%kindness%';
UPDATE journey_templates SET badge_emoji = '📚' WHERE title ILIKE '%reading%';
UPDATE journey_templates SET badge_emoji = '💪' WHERE title ILIKE '%healthy%' OR title ILIKE '%health%';
UPDATE journey_templates SET badge_emoji = '🎨' WHERE title ILIKE '%creative%';
UPDATE journey_templates SET badge_emoji = '🌻' WHERE title ILIKE '%gratitude%';
UPDATE journey_templates SET badge_emoji = '🔬' WHERE title ILIKE '%science%';
UPDATE journey_templates SET badge_emoji = '🧘' WHERE title ILIKE '%mindful%';

-- Add badge_emoji to journeys (copied from template on creation, or custom for custom journeys)
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS badge_emoji TEXT NOT NULL DEFAULT '🏅';

-- Add requirement_metadata to badge_definitions for template/journey-specific matching
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS requirement_metadata JSONB NOT NULL DEFAULT '{}';

-- Seed one badge definition per journey template
INSERT INTO badge_definitions (
  id, name, display_name, description,
  category, icon_url, requirement_type, requirement_value,
  requirement_metadata, sort_order, is_active
)
SELECT
  gen_random_uuid(),
  'journey_complete_' || LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '_', 'g')),
  title || ' Champion',
  'You completed the ' || title || ' journey! Amazing work! 🎉',
  'journey',
  badge_emoji,
  'journey_template_completion',
  1,
  jsonb_build_object('template_id', id::text),
  (200 + ROW_NUMBER() OVER (ORDER BY title))::integer,
  true
FROM journey_templates
WHERE is_active = true;
