-- Migration: 020_chat_sessions.sql
-- Purpose: Add session-based chat support (like ChatGPT)
-- Created: 2026-02-02

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  mood VARCHAR(20),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add is_active column if table exists but column doesn't (recovery from partial migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Index for fetching sessions by child
CREATE INDEX IF NOT EXISTS idx_chat_sessions_child
  ON chat_sessions(child_profile_id, created_at DESC);

-- Index for fetching active sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active
  ON chat_sessions(child_profile_id, is_active, last_message_at DESC);

-- Add session_id to buddy_messages
ALTER TABLE buddy_messages ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- Index for fetching messages by session
CREATE INDEX IF NOT EXISTS idx_buddy_messages_session
  ON buddy_messages(session_id, created_at ASC);

-- Function to update session stats when message is added
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET message_count = message_count + 1,
      last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session stats
DROP TRIGGER IF EXISTS trg_update_session_stats ON buddy_messages;
CREATE TRIGGER trg_update_session_stats
  AFTER INSERT ON buddy_messages
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION update_session_stats();

-- Update mood_checkins to link to chat session
-- (session_id column already exists from mood_checkins migration)
