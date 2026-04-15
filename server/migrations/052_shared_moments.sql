-- Shared moments: things a child explicitly chose to share with their parent
-- (journey completions, new stories they created, stories they just read).
-- Appears in a "Shared with you" section on the parent dashboard home until
-- the parent marks them as seen.

CREATE TABLE IF NOT EXISTS shared_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  moment_type text NOT NULL CHECK (moment_type IN ('journey_complete', 'story_created', 'story_read')),
  title text NOT NULL,
  context text,
  reflection text,
  reference_id uuid,
  is_seen boolean NOT NULL DEFAULT false,
  shared_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_moments_user_unseen
  ON shared_moments(user_id, is_seen, shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_moments_child
  ON shared_moments(child_profile_id);
