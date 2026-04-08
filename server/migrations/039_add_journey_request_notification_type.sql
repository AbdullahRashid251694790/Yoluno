-- Add journey_request to parent_notifications notification_type check constraint
ALTER TABLE parent_notifications
  DROP CONSTRAINT parent_notifications_notification_type_check;

ALTER TABLE parent_notifications
  ADD CONSTRAINT parent_notifications_notification_type_check
  CHECK (notification_type IN (
    'password_change_request',
    'journey_request',
    'other'
  ));
