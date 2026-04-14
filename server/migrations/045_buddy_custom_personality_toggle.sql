-- Add toggle to enable/disable custom personality overrides.
-- When false (default), the AI uses age-based personality automatically.
-- When true, the parent's manual slider values are used.

ALTER TABLE chat_buddies
  ADD COLUMN IF NOT EXISTS use_custom_personality boolean NOT NULL DEFAULT false;
