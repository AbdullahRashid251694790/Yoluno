-- Remove the per-invite recording cap. Invites are now unlimited until they
-- expire or are revoked. Drop the now-unused max_uses / used_count columns.

ALTER TABLE voice_recording_invites DROP COLUMN IF EXISTS max_uses;
ALTER TABLE voice_recording_invites DROP COLUMN IF EXISTS used_count;
