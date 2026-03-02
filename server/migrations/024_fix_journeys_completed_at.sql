-- Add missing completed_at column to journeys table
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Clean up any orphaned journeys with 0 steps (created before template steps were seeded)
DELETE FROM journeys
WHERE id IN (
  SELECT j.id FROM journeys j
  LEFT JOIN journey_steps js ON js.journey_id = j.id
  GROUP BY j.id
  HAVING COUNT(js.id) = 0
);
