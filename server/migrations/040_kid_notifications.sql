-- Kid notifications table for child-facing notifications
CREATE TABLE IF NOT EXISTS kid_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN (
    'story_complete',
    'other'
  )),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  -- Optional metadata (e.g. story ID for story_complete)
  metadata jsonb DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kid_notifications_child ON kid_notifications(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_kid_notifications_unread ON kid_notifications(child_profile_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_kid_notifications_created ON kid_notifications(created_at DESC);
