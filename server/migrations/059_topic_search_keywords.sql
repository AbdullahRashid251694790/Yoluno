-- Add search_keywords array to topics so matching works with synonyms
-- and natural language, not just exact topic name substrings.

ALTER TABLE topics ADD COLUMN IF NOT EXISTS search_keywords text[] DEFAULT '{}';
