-- Migration 029: Upgrade family members for proper family tree
-- Adds: side (maternal/paternal), specific_relationship, video_url, parent_member_id

-- Add new columns
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS side VARCHAR(20) DEFAULT 'direct';
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS specific_relationship VARCHAR(50);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS parent_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL;

-- Index for tree traversal
CREATE INDEX IF NOT EXISTS idx_family_members_parent ON family_members(parent_member_id);
CREATE INDEX IF NOT EXISTS idx_family_members_side ON family_members(user_id, side);

-- Backfill existing data: derive side from connection_description where possible
UPDATE family_members SET side = 'direct' WHERE relationship IN ('parent', 'sibling', 'child', 'spouse');

-- Derive specific_relationship from generic relationship for existing records
UPDATE family_members SET specific_relationship =
  CASE relationship
    WHEN 'parent' THEN 'parent'
    WHEN 'grandparent' THEN 'grandparent'
    WHEN 'sibling' THEN 'sibling'
    WHEN 'aunt_uncle' THEN 'aunt_uncle'
    WHEN 'cousin' THEN 'cousin'
    WHEN 'spouse' THEN 'spouse'
    WHEN 'child' THEN 'child'
    ELSE 'other'
  END
WHERE specific_relationship IS NULL;
