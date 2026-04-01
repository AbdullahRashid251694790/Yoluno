-- Migration 033: Track who created a story (parent vs child)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS created_by VARCHAR(10) DEFAULT 'parent';
