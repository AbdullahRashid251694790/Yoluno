-- Add report_type to distinguish topic redirections from language/safety flags.
-- 'topic_redirect' = child asked about a banned topic
-- 'language' = child used concerning language
-- 'safety' = other safety concerns

ALTER TABLE safety_reports ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'safety';

-- Backfill existing reports based on issue_summary content
UPDATE safety_reports SET report_type = 'topic_redirect'
WHERE issue_summary LIKE '%asked about:%' AND severity = 'yellow';

UPDATE safety_reports SET report_type = 'language'
WHERE issue_summary LIKE '%concerning language%';
