-- Story Pages table for storybook experience
-- Each story can have multiple pages with individual illustrations

CREATE TABLE IF NOT EXISTS story_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  page_number integer NOT NULL,
  content text NOT NULL,
  illustration_prompt text,
  illustration_url text,
  illustration_status text DEFAULT 'pending' CHECK (illustration_status IN ('pending', 'generating', 'completed', 'failed')),
  audio_url text,
  audio_duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, page_number)
);

-- Add cover_image_url to stories for the cover page
ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add has_pages flag to stories for identifying storybook-format stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS has_pages boolean DEFAULT false;

-- Add narrator_voice preference to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS narrator_voice text DEFAULT 'nova';

-- Indexes for efficient page queries
CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_story_page ON story_pages(story_id, page_number);

-- Trigger for updated_at
CREATE TRIGGER update_story_pages_updated_at
  BEFORE UPDATE ON story_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
