-- Add journey and story notification preferences to user_safety_settings.
-- Controls whether the parent gets a dashboard notification when a child
-- completes a journey or creates a new story.

ALTER TABLE user_safety_settings
  ADD COLUMN IF NOT EXISTS notify_on_journey boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_story boolean NOT NULL DEFAULT false;

-- Expand the parent_notifications check constraint to include new types
ALTER TABLE parent_notifications
  DROP CONSTRAINT IF EXISTS parent_notifications_notification_type_check;

ALTER TABLE parent_notifications
  ADD CONSTRAINT parent_notifications_notification_type_check
  CHECK (notification_type IN (
    'password_change_request',
    'journey_request',
    'more_time_request',
    'journey_completed',
    'story_created',
    'other'
  ));
