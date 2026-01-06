-- Add gender column to child_profiles table for story personalization
ALTER TABLE child_profiles
ADD COLUMN gender text CHECK (gender IN ('boy', 'girl', 'prefer_not_to_say'));
