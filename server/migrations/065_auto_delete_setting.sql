-- Add auto_delete_days to user_safety_settings.
-- null = never delete, otherwise number of days after which conversation logs are purged.

ALTER TABLE user_safety_settings
  ADD COLUMN IF NOT EXISTS auto_delete_days int DEFAULT NULL;
