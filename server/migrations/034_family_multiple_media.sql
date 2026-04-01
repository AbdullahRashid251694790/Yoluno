-- Migration 034: Multiple videos and stories per family member

CREATE TABLE IF NOT EXISTS family_member_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_member_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_member_videos ON family_member_videos(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_member_stories ON family_member_stories(family_member_id);

-- Migrate existing data: copy single video_url to new table
INSERT INTO family_member_videos (family_member_id, video_url, title)
SELECT id, video_url, 'Video'
FROM family_members
WHERE video_url IS NOT NULL AND video_url != '';

-- Migrate existing fun_facts to new table
INSERT INTO family_member_stories (family_member_id, content)
SELECT id, fun_facts
FROM family_members
WHERE fun_facts IS NOT NULL AND fun_facts != '';
