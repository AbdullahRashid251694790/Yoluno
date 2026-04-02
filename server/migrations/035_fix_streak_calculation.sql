-- Fix streak values: previous calculation used wrong formula (subtraction instead of addition)
-- Recalculate current_streak for all children from streak_history raw data

UPDATE child_stats cs
SET current_streak = COALESCE(
  (
    WITH consecutive_days AS (
      SELECT activity_date,
             activity_date + (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int AS grp
      FROM streak_history
      WHERE child_profile_id = cs.child_profile_id
      ORDER BY activity_date DESC
    )
    SELECT COUNT(*)::integer
    FROM consecutive_days
    WHERE grp = (SELECT grp FROM consecutive_days LIMIT 1)
  ),
  0
),
longest_streak = GREATEST(
  longest_streak,
  COALESCE(
    (
      WITH consecutive_days AS (
        SELECT activity_date,
               activity_date + (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int AS grp
        FROM streak_history
        WHERE child_profile_id = cs.child_profile_id
        ORDER BY activity_date DESC
      )
      SELECT COUNT(*)::integer
      FROM consecutive_days
      WHERE grp = (SELECT grp FROM consecutive_days LIMIT 1)
    ),
    0
  )
);
