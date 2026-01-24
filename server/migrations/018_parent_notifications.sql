-- Migration: Parent Notifications
-- Description: Add notifications table for parent alerts (e.g., password change requests from kids)

-- Parent notifications table
CREATE TABLE IF NOT EXISTS parent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'password_change_request',
    'other'
  )),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Index for fetching user's notifications
CREATE INDEX IF NOT EXISTS idx_parent_notifications_user ON parent_notifications(user_id);

-- Index for fetching unread notifications efficiently
CREATE INDEX IF NOT EXISTS idx_parent_notifications_unread ON parent_notifications(user_id, is_read) WHERE is_read = false;

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_parent_notifications_created ON parent_notifications(created_at DESC);

-- Trigger to update read_at when is_read changes to true
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_read_at ON parent_notifications;
CREATE TRIGGER trigger_notification_read_at
  BEFORE UPDATE ON parent_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();
