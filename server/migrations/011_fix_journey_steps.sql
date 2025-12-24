-- Add missing columns to journey_steps table
-- The backend expects title and description columns for storing step details

ALTER TABLE journey_steps
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text;

-- Make type column nullable since templates might not always have a type
ALTER TABLE journey_steps
ALTER COLUMN type DROP NOT NULL;
