-- Multiple photos per family member (separate from profile photo)
CREATE TABLE IF NOT EXISTS family_member_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_member_photos_member ON family_member_photos(family_member_id);
