-- Optional per-child session time limit (in minutes). NULL means no limit.
-- Parents can set this to control how long each child's session lasts.
ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS session_time_limit_minutes integer DEFAULT NULL;
