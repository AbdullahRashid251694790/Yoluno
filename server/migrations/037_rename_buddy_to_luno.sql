-- Migration 037: Rename default "buddy" chatbot name to "Luno" for all existing accounts
UPDATE chat_buddies SET name = 'Luno' WHERE LOWER(name) = 'buddy';
