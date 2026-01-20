-- Migration: 016_journey_enhancements
-- Description: Add journey management, reminders, rewards, and image support

-- Image support in buddy messages
ALTER TABLE buddy_messages
  ADD COLUMN IF NOT EXISTS image_key TEXT,
  ADD COLUMN IF NOT EXISTS image_analysis TEXT;

-- Add image proof requirement to journeys (configurable per journey)
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS requires_image_proof BOOLEAN DEFAULT false;

-- Add title field to journeys if not exists (may have been added before)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journeys' AND column_name = 'title') THEN
    ALTER TABLE journeys ADD COLUMN title TEXT;
  END IF;
END $$;

-- Add description to journey_steps if not exists
ALTER TABLE journey_steps ADD COLUMN IF NOT EXISTS description TEXT;

-- Add reward image to journey templates (source of all reward images)
ALTER TABLE journey_templates ADD COLUMN IF NOT EXISTS reward_image_url TEXT;

-- Reminder settings per child
CREATE TABLE IF NOT EXISTS journey_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reminders_enabled BOOLEAN DEFAULT true,
  reminder_interval_hours INTEGER NOT NULL DEFAULT 24,
  quiet_hours_start TIME DEFAULT '20:00',
  quiet_hours_end TIME DEFAULT '08:00',
  max_reminders_per_day INTEGER DEFAULT 3,
  reminder_tone TEXT DEFAULT 'encouraging' CHECK (reminder_tone IN ('encouraging', 'playful', 'gentle')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reminder queue for scheduled reminders
CREATE TABLE IF NOT EXISTS journey_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE NOT NULL,
  journey_step_id UUID REFERENCES journey_steps(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  message_content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Journey rewards (earned images when journey completes)
CREATE TABLE IF NOT EXISTS journey_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE NOT NULL,
  reward_image_url TEXT NOT NULL,
  reward_title TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed BOOLEAN DEFAULT false,
  UNIQUE(child_profile_id, journey_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journey_reminders_pending
  ON journey_reminders(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_journey_reminders_child
  ON journey_reminders(child_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_journey_rewards_child
  ON journey_rewards(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_journey_rewards_unviewed
  ON journey_rewards(child_profile_id) WHERE viewed = false;
CREATE INDEX IF NOT EXISTS idx_buddy_messages_image
  ON buddy_messages(image_key) WHERE image_key IS NOT NULL;
