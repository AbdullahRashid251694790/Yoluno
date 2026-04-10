-- Add family_update to kid_notifications notification_type check constraint
ALTER TABLE kid_notifications
  DROP CONSTRAINT kid_notifications_notification_type_check;

ALTER TABLE kid_notifications
  ADD CONSTRAINT kid_notifications_notification_type_check
  CHECK (notification_type IN (
    'story_complete',
    'family_update',
    'other'
  ));
