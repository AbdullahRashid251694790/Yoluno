-- Remove duplicate active/paused journeys: keep the one with the most
-- progress (or most recent) per child + template pair.

DELETE FROM journeys
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY child_profile_id, template_id
             ORDER BY progress DESC, created_at DESC
           ) AS rn
    FROM journeys
    WHERE status IN ('active', 'paused')
      AND template_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);
