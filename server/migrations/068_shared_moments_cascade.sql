-- Auto-clean shared_moments when the referenced entity is deleted.
-- reference_id is polymorphic (session/story/journey/family_member depending
-- on moment_type), so we can't use a single FK. Triggers handle each case.

-- Chat sessions → curiosity, mood_checkin, deep_chat moments
CREATE OR REPLACE FUNCTION cleanup_shared_moments_on_session_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM shared_moments
  WHERE reference_id = OLD.id
    AND moment_type IN ('curiosity', 'mood_checkin', 'deep_chat');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_moments_on_session_delete ON chat_sessions;
CREATE TRIGGER trg_cleanup_moments_on_session_delete
  BEFORE DELETE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_shared_moments_on_session_delete();

-- Stories → story_created, story_read moments
CREATE OR REPLACE FUNCTION cleanup_shared_moments_on_story_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM shared_moments
  WHERE reference_id = OLD.id
    AND moment_type IN ('story_created', 'story_read');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_moments_on_story_delete ON stories;
CREATE TRIGGER trg_cleanup_moments_on_story_delete
  BEFORE DELETE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_shared_moments_on_story_delete();

-- Journeys → journey_complete moments
CREATE OR REPLACE FUNCTION cleanup_shared_moments_on_journey_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM shared_moments
  WHERE reference_id = OLD.id
    AND moment_type = 'journey_complete';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_moments_on_journey_delete ON journeys;
CREATE TRIGGER trg_cleanup_moments_on_journey_delete
  BEFORE DELETE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_shared_moments_on_journey_delete();

-- Family members → family_listen moments
CREATE OR REPLACE FUNCTION cleanup_shared_moments_on_family_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM shared_moments
  WHERE reference_id = OLD.id
    AND moment_type = 'family_listen';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_moments_on_family_delete ON family_members;
CREATE TRIGGER trg_cleanup_moments_on_family_delete
  BEFORE DELETE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_shared_moments_on_family_delete();

-- Clean up any existing orphans (one-time)
DELETE FROM shared_moments sm
WHERE sm.reference_id IS NOT NULL
  AND (
    (sm.moment_type IN ('curiosity', 'mood_checkin', 'deep_chat')
      AND NOT EXISTS (SELECT 1 FROM chat_sessions WHERE id = sm.reference_id))
    OR (sm.moment_type IN ('story_created', 'story_read')
      AND NOT EXISTS (SELECT 1 FROM stories WHERE id = sm.reference_id))
    OR (sm.moment_type = 'journey_complete'
      AND NOT EXISTS (SELECT 1 FROM journeys WHERE id = sm.reference_id))
    OR (sm.moment_type = 'family_listen'
      AND NOT EXISTS (SELECT 1 FROM family_members WHERE id = sm.reference_id))
  );
