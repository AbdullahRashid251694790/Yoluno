-- Remove auto-created shared_moments for parent-authored stories.
-- These moments were appearing in the kid's My Moments view with a
-- "Share with parent" button, which doesn't make sense because the
-- parent is the originator. Going forward, storyGeneration.ts skips
-- creating them when created_by = 'parent'.

DELETE FROM shared_moments
WHERE moment_type = 'story_created'
  AND reference_id IN (
    SELECT id FROM stories WHERE created_by = 'parent'
  );

-- Note: parent_notifications ("Your child created a new story!") are
-- left alone. The message format is identical for parent- and
-- kid-created stories and there's no FK, so there's no safe way to
-- distinguish them in the existing history. The bell items are
-- informational and will naturally clear as the parent reads them.
