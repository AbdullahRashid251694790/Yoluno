-- Rename all existing buddies to Luno
UPDATE chat_buddies SET name = 'Luno' WHERE name IN ('Buddy', 'Cosmo');

-- Update default value for new buddies
ALTER TABLE chat_buddies ALTER COLUMN name SET DEFAULT 'Luno';
