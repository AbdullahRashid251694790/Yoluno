-- Migration 032: Daily missions system
-- 3 auto-generated missions per child per day

CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,

  mission_1_type TEXT NOT NULL,
  mission_1_title TEXT NOT NULL,
  mission_1_emoji TEXT NOT NULL DEFAULT '✨',
  mission_1_completed BOOLEAN DEFAULT false,

  mission_2_type TEXT NOT NULL,
  mission_2_title TEXT NOT NULL,
  mission_2_emoji TEXT NOT NULL DEFAULT '✨',
  mission_2_completed BOOLEAN DEFAULT false,

  mission_3_type TEXT NOT NULL,
  mission_3_title TEXT NOT NULL,
  mission_3_emoji TEXT NOT NULL DEFAULT '✨',
  mission_3_completed BOOLEAN DEFAULT false,

  all_completed BOOLEAN DEFAULT false,
  bonus_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(child_profile_id, mission_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_missions_child_date
  ON daily_missions(child_profile_id, mission_date DESC);
