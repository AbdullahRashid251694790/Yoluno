-- Migration 021: Audit Fixes
-- Adds missing features identified in product spec audit

-- 1. Add birthday column to child_profiles
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS birthday DATE;

-- 2. Add mood_checkin activity type
INSERT INTO activity_types (name, display_name, description, points_value, icon_name, category) VALUES
  ('mood_checkin', 'Mood Check-in', 'Completed a mood check-in', 5, 'smile', 'social')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  points_value = EXCLUDED.points_value,
  icon_name = EXCLUDED.icon_name,
  category = EXCLUDED.category;

-- 3. Update point values to match spec
UPDATE activity_types SET points_value = 15 WHERE name = 'journey_step_completed';
UPDATE activity_types SET points_value = 5 WHERE name = 'daily_login';

-- 4. Add chat_session_completed activity type (per-session instead of per-message)
INSERT INTO activity_types (name, display_name, description, points_value, icon_name, category) VALUES
  ('chat_session_completed', 'Chat Session', 'Completed a chat session with Luno', 5, 'message-circle', 'chat')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  points_value = EXCLUDED.points_value,
  icon_name = EXCLUDED.icon_name,
  category = EXCLUDED.category;

-- 5. Add family and mood badge categories
-- First, alter the CHECK constraint on badge_definitions to allow new categories
ALTER TABLE badge_definitions DROP CONSTRAINT IF EXISTS badge_definitions_category_check;
ALTER TABLE badge_definitions ADD CONSTRAINT badge_definitions_category_check
  CHECK (category IN ('streak', 'learning', 'story', 'journey', 'special', 'family', 'mood'));

-- 6. Seed Family Explorer badges
INSERT INTO badge_definitions (name, display_name, description, category, icon_url, requirement_type, requirement_value, requirement_metadata, sort_order) VALUES
  ('family_first', 'Family First', 'Explored the family tree for the first time!', 'family', '/badges/family-first.svg', 'activity_count', 1, '{"activity_type": "family_explored"}', 50),
  ('family_explorer', 'Family Explorer', 'Explored the family tree 10 times', 'family', '/badges/family-explorer.svg', 'activity_count', 10, '{"activity_type": "family_explored"}', 51),
  ('family_champion', 'Family Champion', 'Explored the family tree 50 times', 'family', '/badges/family-champion.svg', 'activity_count', 50, '{"activity_type": "family_explored"}', 52)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_url = EXCLUDED.icon_url,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  requirement_metadata = EXCLUDED.requirement_metadata,
  sort_order = EXCLUDED.sort_order;

-- 7. Seed Mood Master badges
INSERT INTO badge_definitions (name, display_name, description, category, icon_url, requirement_type, requirement_value, requirement_metadata, sort_order) VALUES
  ('mood_starter', 'Mood Starter', 'Completed your first mood check-in!', 'mood', '/badges/mood-starter.svg', 'activity_count', 1, '{"activity_type": "mood_checkin"}', 55),
  ('mood_tracker', 'Mood Tracker', 'Completed 10 mood check-ins', 'mood', '/badges/mood-tracker.svg', 'activity_count', 10, '{"activity_type": "mood_checkin"}', 56),
  ('mood_master', 'Mood Master', 'Completed 50 mood check-ins', 'mood', '/badges/mood-master.svg', 'activity_count', 50, '{"activity_type": "mood_checkin"}', 57)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_url = EXCLUDED.icon_url,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  requirement_metadata = EXCLUDED.requirement_metadata,
  sort_order = EXCLUDED.sort_order;

-- 8. Update mood_checkins CHECK constraint to allow new moods
ALTER TABLE mood_checkins DROP CONSTRAINT IF EXISTS mood_checkins_mood_check;
ALTER TABLE mood_checkins ADD CONSTRAINT mood_checkins_mood_check
  CHECK (mood IN ('happy', 'sad', 'angry', 'scared', 'calm', 'worried', 'tired', 'excited'));

-- 9. Add email verification token expiry column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires timestamptz;
