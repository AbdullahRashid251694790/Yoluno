-- Per-user safety notification preferences. Controls whether the parent
-- receives dashboard notifications for topic redirections and safety reports.

CREATE TABLE IF NOT EXISTS user_safety_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notify_on_redirect boolean NOT NULL DEFAULT false,
  notify_on_report boolean NOT NULL DEFAULT true,
  weekly_summary boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
