-- Track when the user last exported or deleted data, for rate limiting and display.

ALTER TABLE user_safety_settings
  ADD COLUMN IF NOT EXISTS last_export_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_delete_at timestamptz DEFAULT NULL;
