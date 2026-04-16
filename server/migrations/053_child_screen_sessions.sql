-- Track how long each child spends on their kids screens. The frontend
-- sends a heartbeat every ~30 seconds while a child is on any /kids/ route.
-- The backend extends an active session if the last heartbeat was within
-- 90 seconds, otherwise starts a new one. Session duration is computed as
-- last_heartbeat_at - started_at.

CREATE TABLE IF NOT EXISTS child_screen_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_screen_sessions_child_recent
  ON child_screen_sessions(child_profile_id, last_heartbeat_at DESC);
