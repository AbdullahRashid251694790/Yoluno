-- Migration 010: Family Enhancements
-- Family events, photos, timeline, and export

-- Family Events
CREATE TABLE IF NOT EXISTS family_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'birth', 'death', 'marriage', 'graduation', 'achievement',
    'holiday', 'reunion', 'milestone', 'other'
  )),
  title text NOT NULL,
  description text,
  event_date date,
  event_year integer,
  location text,
  photos jsonb DEFAULT '[]',
  is_private boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Family Photos (gallery)
CREATE TABLE IF NOT EXISTS family_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  photo_url text NOT NULL,
  thumbnail_url text,
  caption text,
  photo_date date,
  location text,
  tags jsonb DEFAULT '[]',
  is_favorite boolean DEFAULT false,
  width integer,
  height integer,
  file_size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Export Configs (available export formats)
CREATE TABLE IF NOT EXISTS export_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  mime_type text NOT NULL,
  file_extension text NOT NULL,
  is_enabled boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Family Narratives (rich text stories about family members)
CREATE TABLE IF NOT EXISTS family_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'markdown' CHECK (content_type IN ('markdown', 'html', 'plain')),
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_family_events_user ON family_events(user_id);
CREATE INDEX IF NOT EXISTS idx_family_events_member ON family_events(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_events_date ON family_events(event_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_family_events_year ON family_events(event_year DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_family_events_type ON family_events(event_type);

CREATE INDEX IF NOT EXISTS idx_family_photos_user ON family_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_family_photos_member ON family_photos(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_photos_date ON family_photos(photo_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_family_photos_favorite ON family_photos(is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_family_narratives_user ON family_narratives(user_id);
CREATE INDEX IF NOT EXISTS idx_family_narratives_member ON family_narratives(family_member_id);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_family_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_family_events_updated_at ON family_events;
CREATE TRIGGER update_family_events_updated_at
  BEFORE UPDATE ON family_events
  FOR EACH ROW
  EXECUTE FUNCTION update_family_events_updated_at();

CREATE OR REPLACE FUNCTION update_family_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_family_photos_updated_at ON family_photos;
CREATE TRIGGER update_family_photos_updated_at
  BEFORE UPDATE ON family_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_family_photos_updated_at();

CREATE OR REPLACE FUNCTION update_family_narratives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_family_narratives_updated_at ON family_narratives;
CREATE TRIGGER update_family_narratives_updated_at
  BEFORE UPDATE ON family_narratives
  FOR EACH ROW
  EXECUTE FUNCTION update_family_narratives_updated_at();

-- Seed export configs
INSERT INTO export_configs (format, label, description, mime_type, file_extension, is_premium) VALUES
  ('png', 'PNG Image', 'Export as a high-quality image', 'image/png', 'png', false),
  ('pdf', 'PDF Document', 'Export as a printable PDF document', 'application/pdf', 'pdf', false),
  ('json', 'JSON Data', 'Export raw data in JSON format', 'application/json', 'json', false),
  ('svg', 'SVG Vector', 'Export as scalable vector graphic', 'image/svg+xml', 'svg', true)
ON CONFLICT (format) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  mime_type = EXCLUDED.mime_type,
  file_extension = EXCLUDED.file_extension,
  is_premium = EXCLUDED.is_premium;
