-- Track per-child reading progress for stories. Updated every time
-- a child flips a page in the StorybookReader. Parents query this to
-- show In Progress / Completed tabs on the Stories page.

CREATE TABLE IF NOT EXISTS story_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  last_page_read integer NOT NULL DEFAULT 0,
  total_pages integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_profile_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_reading_progress_child
  ON story_reading_progress(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_story_reading_progress_story
  ON story_reading_progress(story_id);
