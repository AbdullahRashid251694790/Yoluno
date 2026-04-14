-- Voice recording invites: public tokens that allow non-users to record
-- voice messages that land in a parent's voice vault.

CREATE TABLE IF NOT EXISTS voice_recording_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses integer NOT NULL DEFAULT 5,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_voice_invites_user ON voice_recording_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_invites_active ON voice_recording_invites(is_active, expires_at);
