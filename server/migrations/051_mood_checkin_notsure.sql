-- Allow "notsure" as a valid mood value on mood_checkins so kids can skip
-- committing to a specific feeling during the daily check-in.

ALTER TABLE mood_checkins DROP CONSTRAINT IF EXISTS mood_checkins_mood_check;
ALTER TABLE mood_checkins ADD CONSTRAINT mood_checkins_mood_check
  CHECK (mood IN ('happy', 'sad', 'angry', 'scared', 'calm', 'worried', 'tired', 'excited', 'notsure'));
