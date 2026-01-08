-- Add protagonist_avatar column to stories table
-- Stores the selected avatar name (Lolo, Lumi, Luno) for the story

ALTER TABLE stories ADD COLUMN IF NOT EXISTS protagonist_avatar text;
