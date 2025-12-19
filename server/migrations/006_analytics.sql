-- Migration 006: Analytics
-- Daily analytics and topic tracking for parent insights

-- Daily Analytics Aggregation (one row per child per day)
CREATE TABLE IF NOT EXISTS daily_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  message_count integer NOT NULL DEFAULT 0,
  story_count integer NOT NULL DEFAULT 0,
  story_read_count integer NOT NULL DEFAULT 0,
  journey_steps_completed integer NOT NULL DEFAULT 0,
  session_duration_minutes integer NOT NULL DEFAULT 0,
  topics_explored text[] DEFAULT '{}',
  safety_flags_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_profile_id, date)
);

-- Topic Analytics (aggregated topic mentions per child)
CREATE TABLE IF NOT EXISTS topic_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  mention_count integer NOT NULL DEFAULT 1,
  first_mentioned_at timestamptz NOT NULL DEFAULT now(),
  last_mentioned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_profile_id, topic)
);

-- Activity Timeline (detailed activity log for timeline view)
CREATE TABLE IF NOT EXISTS activity_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN (
    'chat_started', 'chat_ended',
    'story_created', 'story_read',
    'journey_started', 'journey_step_completed', 'journey_completed',
    'badge_earned', 'streak_milestone',
    'safety_flag'
  )),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_analytics_child ON daily_analytics(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_child_date ON daily_analytics(child_profile_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_user ON daily_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_topic_analytics_child ON topic_analytics(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_topic_analytics_count ON topic_analytics(child_profile_id, mention_count DESC);

CREATE INDEX IF NOT EXISTS idx_activity_timeline_child ON activity_timeline(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_created ON activity_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_type ON activity_timeline(activity_type);

-- Updated at trigger for daily_analytics
CREATE OR REPLACE FUNCTION update_daily_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_analytics_updated_at ON daily_analytics;
CREATE TRIGGER update_daily_analytics_updated_at
  BEFORE UPDATE ON daily_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_analytics_updated_at();

-- Function to upsert daily analytics
CREATE OR REPLACE FUNCTION upsert_daily_analytics(
  p_user_id uuid,
  p_child_profile_id uuid,
  p_date date,
  p_message_count integer DEFAULT 0,
  p_story_count integer DEFAULT 0,
  p_story_read_count integer DEFAULT 0,
  p_journey_steps integer DEFAULT 0,
  p_session_minutes integer DEFAULT 0,
  p_topics text[] DEFAULT '{}',
  p_safety_flags integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_analytics (
    user_id, child_profile_id, date,
    message_count, story_count, story_read_count,
    journey_steps_completed, session_duration_minutes,
    topics_explored, safety_flags_count
  ) VALUES (
    p_user_id, p_child_profile_id, p_date,
    p_message_count, p_story_count, p_story_read_count,
    p_journey_steps, p_session_minutes,
    p_topics, p_safety_flags
  )
  ON CONFLICT (child_profile_id, date) DO UPDATE SET
    message_count = daily_analytics.message_count + p_message_count,
    story_count = daily_analytics.story_count + p_story_count,
    story_read_count = daily_analytics.story_read_count + p_story_read_count,
    journey_steps_completed = daily_analytics.journey_steps_completed + p_journey_steps,
    session_duration_minutes = daily_analytics.session_duration_minutes + p_session_minutes,
    topics_explored = ARRAY(
      SELECT DISTINCT unnest(daily_analytics.topics_explored || p_topics)
    ),
    safety_flags_count = daily_analytics.safety_flags_count + p_safety_flags;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert topic analytics
CREATE OR REPLACE FUNCTION upsert_topic_analytics(
  p_child_profile_id uuid,
  p_topic text
)
RETURNS void AS $$
BEGIN
  INSERT INTO topic_analytics (child_profile_id, topic, mention_count, last_mentioned_at)
  VALUES (p_child_profile_id, p_topic, 1, now())
  ON CONFLICT (child_profile_id, topic) DO UPDATE SET
    mention_count = topic_analytics.mention_count + 1,
    last_mentioned_at = now();
END;
$$ LANGUAGE plpgsql;
