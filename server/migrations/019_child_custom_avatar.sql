-- Migration: Child Custom Avatar
-- Description: Add custom_avatar_url column for uploaded profile photos

-- Add custom avatar URL column
-- If set, this takes precedence over avatar_id (library avatar)
ALTER TABLE child_profiles
ADD COLUMN IF NOT EXISTS custom_avatar_url text;

-- Add comment for clarity
COMMENT ON COLUMN child_profiles.custom_avatar_url IS 'Custom uploaded avatar URL (S3 key). Takes precedence over avatar_id when set.';
