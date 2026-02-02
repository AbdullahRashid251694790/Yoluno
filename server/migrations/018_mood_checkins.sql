-- Migration: 018_mood_checkins.sql
-- Purpose: Add mood tracking for child check-ins
-- Created: 2026-01-30

-- Mood check-ins table
CREATE TABLE IF NOT EXISTS mood_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  mood VARCHAR(20) NOT NULL CHECK (mood IN ('happy', 'sad', 'angry', 'scared', 'calm')),
  luno_response TEXT,
  suggested_activity TEXT,
  session_id UUID, -- Optional link to chat session if they proceed to chat
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching today's mood check-in
CREATE INDEX IF NOT EXISTS idx_mood_checkins_child_date
  ON mood_checkins(child_profile_id, created_at DESC);

-- Index for mood analytics (distribution queries)
CREATE INDEX IF NOT EXISTS idx_mood_checkins_mood
  ON mood_checkins(mood);

-- Index for date range queries (calendar view)
CREATE INDEX IF NOT EXISTS idx_mood_checkins_created_at
  ON mood_checkins(created_at);
