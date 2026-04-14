-- Backfill: convert voice_clips.audio_url from full URLs / local paths into
-- raw storage keys (e.g. "voice-clips/<userId>/<file.ext>"). The server now
-- resolves the key into a fresh signed URL on every read, so persisting a
-- key (instead of an expiring signed URL) makes playback work indefinitely.
--
-- Idempotent — rows whose audio_url is already a bare key starting with
-- "voice-clips/" are left untouched.

UPDATE voice_clips
SET audio_url = (regexp_match(audio_url, '(voice-clips/[^?]+)'))[1]
WHERE audio_url ~ 'voice-clips/[^?]+'
  AND audio_url NOT LIKE 'voice-clips/%';
