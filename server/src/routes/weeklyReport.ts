/**
 * Weekly Safety Report Email
 *
 * Sends a weekly digest email via Resend to all users who have
 * weekly_summary = true in their safety settings. Includes all
 * safety reports + topic redirections from the past 7 days.
 *
 * Trigger: call POST /api/weekly-report/send with a secret key,
 * e.g. via Railway cron or external scheduler.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';

const router = Router();

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || 'yoluno-weekly-secret';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Yoluno <noreply@yoluno.ai>';

interface UserReport {
  user_id: string;
  email: string;
  reports: {
    severity: string;
    issue_summary: string;
    ai_analysis: string | null;
    child_name: string | null;
    created_at: string;
  }[];
}

function buildEmailHtml(email: string, reports: UserReport['reports']): string {
  const redirections = reports.filter((r) => r.severity === 'yellow');
  const safetyReports = reports.filter((r) => r.severity === 'red');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const reportRows = (items: typeof reports, color: string, label: string) =>
    items.length === 0
      ? `<p style="color:#9B978E;font-size:14px;">No ${label.toLowerCase()} this week.</p>`
      : items
          .map(
            (r) => `
        <div style="border-left:3px solid ${color};padding:12px 16px;margin-bottom:12px;background:#FAFAF7;border-radius:8px;">
          <p style="font-size:12px;color:#9B978E;margin:0 0 4px;">${formatDate(r.created_at)}${r.child_name ? ` — ${r.child_name}` : ''}</p>
          <p style="font-size:14px;color:#2A2926;margin:0 0 4px;font-weight:500;">${r.issue_summary}</p>
          ${r.ai_analysis ? `<p style="font-size:13px;color:#6B675E;margin:0;line-height:1.5;">${r.ai_analysis}</p>` : ''}
        </div>`
          )
          .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'DM Sans','Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:24px;color:#2A2926;margin:0;">Weekly Safety Summary</h1>
      <p style="font-size:14px;color:#9B978E;margin:8px 0 0;">Your children's safety digest for the past 7 days</p>
    </div>

    <div style="background:#FFFFFF;border-radius:12px;padding:24px;border:1px solid #E8E6E1;margin-bottom:24px;">
      <div style="display:flex;gap:16px;margin-bottom:20px;">
        <div style="flex:1;background:#E8F6F4;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:24px;font-weight:600;color:#2A2926;margin:0;">${reports.length}</p>
          <p style="font-size:12px;color:#9B978E;margin:4px 0 0;">Total Events</p>
        </div>
        <div style="flex:1;background:#FDF6E8;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:24px;font-weight:600;color:#2A2926;margin:0;">${redirections.length}</p>
          <p style="font-size:12px;color:#9B978E;margin:4px 0 0;">Redirections</p>
        </div>
        <div style="flex:1;background:#FEF0EA;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:24px;font-weight:600;color:#2A2926;margin:0;">${safetyReports.length}</p>
          <p style="font-size:12px;color:#9B978E;margin:4px 0 0;">Safety Reports</p>
        </div>
      </div>
    </div>

    ${redirections.length > 0 || safetyReports.length > 0 ? `
    <div style="background:#FFFFFF;border-radius:12px;padding:24px;border:1px solid #E8E6E1;margin-bottom:24px;">
      <h2 style="font-size:18px;color:#2A2926;margin:0 0 4px;">Recent Redirections</h2>
      <p style="font-size:13px;color:#9B978E;margin:0 0 16px;">Topics your children asked about that crossed a boundary</p>
      ${reportRows(redirections, '#D4A843', 'Redirections')}
    </div>

    <div style="background:#FFFFFF;border-radius:12px;padding:24px;border:1px solid #E8E6E1;margin-bottom:24px;">
      <h2 style="font-size:18px;color:#2A2926;margin:0 0 4px;">Safety Reports</h2>
      <p style="font-size:13px;color:#9B978E;margin:0 0 16px;">Conversations flagged for your attention</p>
      ${reportRows(safetyReports, '#E8946A', 'Safety reports')}
    </div>
    ` : `
    <div style="background:#E8F6F4;border-radius:12px;padding:40px;text-align:center;margin-bottom:24px;">
      <p style="font-size:28px;margin:0 0 8px;">&#10003;</p>
      <p style="font-size:16px;font-weight:600;color:#2A2926;margin:0 0 8px;">All clear this week!</p>
      <p style="font-size:14px;color:#6B675E;margin:0;line-height:1.6;">All your children stayed within the boundaries you set. No topics were redirected and no safety concerns were flagged. Keep up the great parenting!</p>
    </div>
    `}

    <div style="text-align:center;padding:16px 0;">
      <p style="font-size:12px;color:#9B978E;margin:0;">
        You're receiving this because you enabled weekly safety summaries in your Yoluno settings.
      </p>
      <p style="font-size:12px;color:#9B978E;margin:4px 0 0;">
        Powered by <span style="color:#D4A843;font-weight:600;">Yoluno</span> — a safe world for kids
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * POST /api/weekly-report/send
 * Triggered by cron. Sends weekly safety email to all opted-in users.
 * Requires ?secret= query param matching CRON_SECRET env var.
 */
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { secret } = req.query;
    if (secret !== CRON_SECRET) {
      res.status(401).json({ error: 'Invalid secret' });
      return;
    }

    if (!RESEND_API_KEY) {
      res.status(500).json({ error: 'RESEND_API_KEY not configured' });
      return;
    }

    // Find all users with weekly_summary enabled
    const usersResult = await query<{ user_id: string; email: string }>(
      `SELECT uss.user_id, u.email
       FROM user_safety_settings uss
       INNER JOIN users u ON u.id = uss.user_id
       WHERE uss.weekly_summary = true
         AND u.email IS NOT NULL`
    );

    const sent: string[] = [];
    const failed: string[] = [];

    for (const user of usersResult.rows) {
      // Get reports from past 7 days
      const reportsResult = await query<{
        severity: string;
        issue_summary: string;
        ai_analysis: string | null;
        child_name: string | null;
        created_at: string;
      }>(
        `SELECT sr.severity, sr.issue_summary,
                sr.full_context->>'ai_analysis' as ai_analysis,
                cp.name as child_name, sr.created_at::text
         FROM safety_reports sr
         LEFT JOIN child_profiles cp ON sr.child_profile_id = cp.id
         WHERE sr.user_id = $1
           AND sr.created_at >= NOW() - INTERVAL '7 days'
         ORDER BY sr.created_at DESC`,
        [user.user_id]
      );

      const html = buildEmailHtml(user.email, reportsResult.rows);

      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [user.email],
            subject: `Yoluno Weekly Safety Summary — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            html,
          }),
        });

        if (emailRes.ok) {
          sent.push(user.email);
        } else {
          const errText = await emailRes.text();
          console.error(`Failed to send to ${user.email}:`, errText);
          failed.push(user.email);
        }
      } catch (err) {
        console.error(`Error sending to ${user.email}:`, err);
        failed.push(user.email);
      }
    }

    res.json({
      sent: sent.length,
      failed: failed.length,
      total: usersResult.rows.length,
      details: { sent, failed },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
