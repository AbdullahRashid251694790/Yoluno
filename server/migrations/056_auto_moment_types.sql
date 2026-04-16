-- Expand shared_moments to support auto-tracked moment types:
-- curiosity (deep question in chat), family_listen (played a voice clip),
-- mood_checkin (checked in mood and chatted about it).

ALTER TABLE shared_moments
  DROP CONSTRAINT IF EXISTS shared_moments_moment_type_check;

ALTER TABLE shared_moments
  ADD CONSTRAINT shared_moments_moment_type_check
  CHECK (moment_type IN (
    'journey_complete', 'story_created', 'story_read',
    'curiosity', 'family_listen', 'mood_checkin'
  ));

-- Flag to distinguish child-shared moments (shown in "Shared with you")
-- from auto-generated moments (only shown in Growth Journal).
ALTER TABLE shared_moments
  ADD COLUMN IF NOT EXISTS is_auto boolean NOT NULL DEFAULT false;
