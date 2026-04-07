-- Migration 036: Remove duplicate topics (same name, different categories)
-- Keeps the row with the longer/richer description for each duplicate name

DELETE FROM topics
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY name
             ORDER BY LENGTH(COALESCE(description, '')) DESC, created_at ASC
           ) as rn
    FROM topics
  ) ranked
  WHERE rn > 1
);
