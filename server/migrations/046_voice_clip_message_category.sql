-- Add 'message' to voice_clips category check constraint
ALTER TABLE voice_clips DROP CONSTRAINT IF EXISTS voice_clips_category_check;

ALTER TABLE voice_clips
  ADD CONSTRAINT voice_clips_category_check
  CHECK (category IN ('encouragement', 'praise', 'celebration', 'story', 'memory', 'greeting', 'message', 'other'));
