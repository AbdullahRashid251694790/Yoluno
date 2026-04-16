-- Add 'more_time_request' to parent_notifications notification_type
ALTER TABLE parent_notifications
  DROP CONSTRAINT IF EXISTS parent_notifications_notification_type_check;

ALTER TABLE parent_notifications
  ADD CONSTRAINT parent_notifications_notification_type_check
  CHECK (notification_type IN (
    'password_change_request',
    'journey_request',
    'more_time_request',
    'other'
  ));
