-- Store a one-time visual description of the story's main character so every
-- page illustration can reuse it and keep the character visually consistent.

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS main_character_description text DEFAULT NULL;
