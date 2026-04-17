/**
 * Data Export Route
 *
 * Allows users to download all their data as styled HTML reports.
 * Includes rate limiting (1 export per type per hour) and timestamps.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Yoluno <noreply@yoluno.ai>';

// ─── In-memory rate limiter: 1 export per type per user per hour ───
const exportRateMap = new Map<string, number>();

function checkExportRateLimit(userId: string, type: string): boolean {
  const key = `${userId}:${type}`;
  const last = exportRateMap.get(key);
  const now = Date.now();
  if (last && now - last < 60 * 60 * 1000) return false; // within 1 hour
  exportRateMap.set(key, now);
  return true;
}

/** Update last_export_at timestamp */
async function markExported(userId: string) {
  await queryOne(
    `INSERT INTO user_safety_settings (user_id, last_export_at) VALUES ($1, NOW())
     ON CONFLICT (user_id) DO UPDATE SET last_export_at = NOW()`,
    [userId]
  ).catch(() => {});
}

/** Update last_delete_at timestamp + send confirmation email */
async function markDeleted(userId: string, action: string) {
  await queryOne(
    `INSERT INTO user_safety_settings (user_id, last_delete_at) VALUES ($1, NOW())
     ON CONFLICT (user_id) DO UPDATE SET last_delete_at = NOW()`,
    [userId]
  ).catch(() => {});

  // Send confirmation email
  if (!RESEND_API_KEY) return;
  try {
    const user = await queryOne<{ email: string }>(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );
    if (!user?.email) return;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject: `Yoluno — Data Deletion Confirmation`,
        html: `<div style="font-family:'DM Sans',sans-serif;max-width:500px;margin:0 auto;padding:32px 20px;">
          <h2 style="color:#2A2926;margin-bottom:8px;">Data Deleted</h2>
          <p style="color:#6B675E;line-height:1.6;">The following action was completed on your Yoluno account:</p>
          <div style="background:#FEF0EA;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#E8946A;font-weight:600;margin:0;">${action}</p>
          </div>
          <p style="color:#6B675E;line-height:1.6;">If you did not perform this action, please contact us immediately at <a href="mailto:safety@yoluno.com" style="color:#3ECDC6;">safety@yoluno.com</a>.</p>
          <p style="color:#9B978E;font-size:12px;margin-top:24px;">Powered by <span style="color:#D4A843;font-weight:600;">Yoluno</span></p>
        </div>`,
      }),
    });
  } catch (err) {
    console.error('[data-export] Failed to send delete confirmation email:', (err as Error).message);
  }
}

/** Safe query wrapper — returns empty rows if the table/column doesn't exist */
async function safeQuery(sql: string, params: unknown[]) {
  try {
    return await query(sql, params);
  } catch {
    return { rows: [] };
  }
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildHtmlReport(data: Record<string, any>): string {
  const user = data.user;
  const children: any[] = data.children || [];
  const stories: any[] = data.stories || [];
  const journeys: any[] = data.journeys || [];
  const journeySteps: any[] = data.journey_steps || [];
  const badges: any[] = data.badges || [];
  const moods: any[] = data.mood_checkins || [];
  const family: any[] = data.family_members || [];
  const voiceClips: any[] = data.voice_clips || [];
  const chatMessages: any[] = data.chat_messages || [];
  const buddyMessages: any[] = data.buddy_messages || [];

  // Build child name lookup
  const childNames: Record<string, string> = {};
  for (const c of children) childNames[c.id] = c.name;

  // Group journey steps by journey id
  const stepsByJourney: Record<string, any[]> = {};
  for (const s of journeySteps) {
    if (!stepsByJourney[s.journey_id]) stepsByJourney[s.journey_id] = [];
    stepsByJourney[s.journey_id].push(s);
  }

  // Group buddy messages by child
  const msgsByChild: Record<string, any[]> = {};
  for (const m of buddyMessages) {
    if (!msgsByChild[m.child_profile_id]) msgsByChild[m.child_profile_id] = [];
    msgsByChild[m.child_profile_id].push(m);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yoluno — My Data Export</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #faf9f7; color: #2d2a26; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 2rem; margin-bottom: 0.25rem; color: #2d2a26; }
  h2 { font-size: 1.4rem; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #3dd6c8; color: #2d2a26; }
  h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; color: #555; }
  .subtitle { color: #7a7067; margin-bottom: 2rem; }
  .card { background: #fff; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(45,42,38,0.06); border: 1px solid #eee; }
  .card-header { font-weight: 600; font-size: 1.05rem; margin-bottom: 0.5rem; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; }
  .badge-teal { background: #e0f7f5; color: #1a9e8f; }
  .badge-orange { background: #fde8d8; color: #c66a30; }
  .badge-purple { background: #ede0f7; color: #7b4ea8; }
  .badge-gold { background: #fef3d0; color: #a07d2e; }
  .badge-red { background: #fde0e0; color: #c43030; }
  .badge-gray { background: #f0efed; color: #7a7067; }
  .meta { font-size: 0.85rem; color: #7a7067; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
  .stat-card { background: #fff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(45,42,38,0.06); border: 1px solid #eee; }
  .stat-value { font-size: 2rem; font-weight: 700; color: #3dd6c8; }
  .stat-label { font-size: 0.85rem; color: #7a7067; }
  .message { padding: 0.6rem 1rem; border-radius: 12px; margin-bottom: 0.5rem; max-width: 80%; }
  .message-child { background: #3dd6c8; color: #fff; margin-left: auto; text-align: right; border-bottom-right-radius: 4px; }
  .message-buddy { background: #f0efed; color: #2d2a26; border-bottom-left-radius: 4px; }
  .message-time { font-size: 0.7rem; opacity: 0.7; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { color: #7a7067; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .empty { color: #aaa; font-style: italic; padding: 1rem 0; }
  .section-count { font-weight: 400; color: #7a7067; font-size: 0.9rem; }
  @media print { body { padding: 1rem; } .card { break-inside: avoid; } }
</style>
</head>
<body>

<h1>🌙 Yoluno Data Export</h1>
<p class="subtitle">Exported on ${formatDate(data.exported_at)} for <strong>${escapeHtml(user?.email || '—')}</strong></p>

<!-- Summary Stats -->
<div class="grid">
  <div class="stat-card"><div class="stat-value">${children.length}</div><div class="stat-label">Children</div></div>
  <div class="stat-card"><div class="stat-value">${stories.length}</div><div class="stat-label">Stories</div></div>
  <div class="stat-card"><div class="stat-value">${journeys.length}</div><div class="stat-label">Journeys</div></div>
  <div class="stat-card"><div class="stat-value">${badges.length}</div><div class="stat-label">Badges Earned</div></div>
  <div class="stat-card"><div class="stat-value">${family.length}</div><div class="stat-label">Family Members</div></div>
  <div class="stat-card"><div class="stat-value">${buddyMessages.length}</div><div class="stat-label">Chat Messages</div></div>
</div>

<!-- Children -->
<h2>👧 Children <span class="section-count">(${children.length})</span></h2>
${children.length === 0 ? '<p class="empty">No children added yet.</p>' : children.map((c: any) => `
<div class="card">
  <div class="card-header">${escapeHtml(c.name)}</div>
  <span class="badge badge-teal">${c.age} years old</span>
  ${c.gender && c.gender !== 'prefer_not_to_say' ? `<span class="badge badge-orange">${escapeHtml(c.gender)}</span>` : ''}
  <p class="meta" style="margin-top:0.5rem">Last active: ${formatDateTime(c.last_active_at)} · Joined: ${formatDate(c.created_at)}</p>
</div>`).join('')}

<!-- Family Members -->
<h2>👨‍👩‍👧‍👦 Family Members <span class="section-count">(${family.length})</span></h2>
${family.length === 0 ? '<p class="empty">No family members added.</p>' : family.map((f: any) => `
<div class="card">
  <div class="card-header">${escapeHtml(f.name)}</div>
  <span class="badge badge-purple">${escapeHtml(f.specific_relationship || f.relationship || '—')}</span>
  ${!f.is_alive ? '<span class="badge badge-gray">Remembered</span>' : ''}
  ${f.occupation ? `<p class="meta" style="margin-top:0.5rem">Works as: ${escapeHtml(f.occupation)}</p>` : ''}
  ${f.hobbies?.length ? `<p class="meta">Enjoys: ${f.hobbies.map(escapeHtml).join(', ')}</p>` : ''}
  ${f.fun_facts ? `<p class="meta">Fun fact: ${escapeHtml(f.fun_facts)}</p>` : ''}
  ${f.connection_description ? `<p class="meta">${escapeHtml(f.connection_description)}</p>` : ''}
</div>`).join('')}

<!-- Stories -->
<h2>📖 Stories <span class="section-count">(${stories.length})</span></h2>
${stories.length === 0 ? '<p class="empty">No stories created yet.</p>' : stories.map((s: any) => `
<div class="card">
  <div class="card-header">${escapeHtml(s.title)}</div>
  ${s.theme ? `<span class="badge badge-purple">${escapeHtml(s.theme)}</span>` : ''}
  ${s.mood ? `<span class="badge badge-gold">${escapeHtml(s.mood)}</span>` : ''}
  <p class="meta">For: ${escapeHtml(childNames[s.child_profile_id] || '—')} · ${formatDate(s.created_at)}</p>
  ${s.content ? `<p style="margin-top:0.75rem;font-size:0.9rem">${escapeHtml(s.content).substring(0, 500)}${s.content.length > 500 ? '...' : ''}</p>` : ''}
</div>`).join('')}

<!-- Journeys -->
<h2>🗺️ Journeys <span class="section-count">(${journeys.length})</span></h2>
${journeys.length === 0 ? '<p class="empty">No journeys started yet.</p>' : journeys.map((j: any) => {
    const steps = stepsByJourney[j.id] || [];
    const completedSteps = steps.filter((s: any) => s.completed_at).length;
    return `
<div class="card">
  <div class="card-header">${escapeHtml(j.title)}</div>
  <span class="badge ${j.status === 'completed' ? 'badge-teal' : j.status === 'active' ? 'badge-orange' : 'badge-gray'}">${j.status}</span>
  <span class="badge badge-gray">${completedSteps}/${steps.length} steps</span>
  <p class="meta">For: ${escapeHtml(childNames[j.child_profile_id] || '—')} · Started: ${formatDate(j.created_at)}${j.completed_at ? ` · Completed: ${formatDate(j.completed_at)}` : ''}</p>
  ${steps.length > 0 ? `<table style="margin-top:0.75rem">
    <tr><th>Step</th><th>Status</th></tr>
    ${steps.map((s: any) => `<tr><td>${escapeHtml(s.title || `Step ${s.step_order}`)}</td><td>${s.completed_at ? '✅ Done' : '⏳ Pending'}</td></tr>`).join('')}
  </table>` : ''}
</div>`;
  }).join('')}

<!-- Badges -->
<h2>🏅 Badges Earned <span class="section-count">(${badges.length})</span></h2>
${badges.length === 0 ? '<p class="empty">No badges earned yet.</p>' : `
<div class="grid">
  ${badges.map((b: any) => `
  <div class="card" style="text-align:center">
    <div style="font-size:2rem">${b.badge_emoji || '🏅'}</div>
    <div class="card-header">${escapeHtml(b.display_name || b.name)}</div>
    <p class="meta">${escapeHtml(b.description || '')}</p>
    <p class="meta">${formatDate(b.earned_at || b.created_at)}</p>
  </div>`).join('')}
</div>`}

<!-- Mood Check-ins -->
<h2>💛 Mood Check-ins <span class="section-count">(${moods.length})</span></h2>
${moods.length === 0 ? '<p class="empty">No mood check-ins recorded.</p>' : `
<table>
  <tr><th>Child</th><th>Mood</th><th>Note</th><th>Date</th></tr>
  ${moods.slice(0, 100).map((m: any) => `
  <tr>
    <td>${escapeHtml(childNames[m.child_profile_id] || '—')}</td>
    <td>${escapeHtml(m.mood)}</td>
    <td>${m.note ? escapeHtml(m.note) : '—'}</td>
    <td>${formatDateTime(m.created_at)}</td>
  </tr>`).join('')}
</table>
${moods.length > 100 ? `<p class="meta" style="margin-top:0.5rem">Showing 100 of ${moods.length} check-ins.</p>` : ''}`}

<!-- Chat Conversations -->
<h2>💬 Chat Conversations <span class="section-count">(${buddyMessages.length} messages)</span></h2>
${buddyMessages.length === 0 ? '<p class="empty">No chat messages yet.</p>' : Object.entries(msgsByChild).map(([childId, msgs]) => `
<h3>${escapeHtml(childNames[childId] || 'Unknown Child')}</h3>
<div class="card" style="max-height:400px;overflow-y:auto">
  ${(msgs as any[]).slice(-50).map((m: any) => `
  <div class="message ${m.role === 'child' ? 'message-child' : 'message-buddy'}">
    ${escapeHtml(m.content)}
    <div class="message-time">${formatDateTime(m.created_at)}</div>
  </div>`).join('')}
  ${(msgs as any[]).length > 50 ? `<p class="meta" style="text-align:center;padding:0.5rem">Showing last 50 of ${(msgs as any[]).length} messages.</p>` : ''}
</div>`).join('')}

<!-- Voice Clips -->
<h2>🎙️ Voice Recordings <span class="section-count">(${voiceClips.length})</span></h2>
${voiceClips.length === 0 ? '<p class="empty">No voice recordings saved.</p>' : `
<table>
  <tr><th>Title</th><th>Category</th><th>Duration</th><th>Date</th></tr>
  ${voiceClips.map((v: any) => `
  <tr>
    <td>${escapeHtml(v.title)}</td>
    <td><span class="badge badge-gold">${escapeHtml(v.category || '—')}</span></td>
    <td>${v.duration_seconds ? `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, '0')}` : '—'}</td>
    <td>${formatDate(v.created_at)}</td>
  </tr>`).join('')}
</table>`}

<p style="text-align:center;margin-top:3rem;color:#aaa;font-size:0.85rem">Generated by Yoluno · ${formatDate(data.exported_at)}</p>

</body>
</html>`;
}

// GET /api/data-export
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    if (!checkExportRateLimit(userId, 'all')) {
      res.status(429).json({ error: 'Export limit reached. Please wait 1 hour between exports.' });
      return;
    }

    // Gather all user data in parallel
    const [
      profileResult,
      childrenResult,
      storiesResult,
      journeysResult,
      journeyStepsResult,
      badgesResult,
      moodResult,
      familyResult,
      voiceClipsResult,
      buddyMessagesResult,
    ] = await Promise.all([
      query('SELECT id, email, email_verified, created_at FROM users WHERE id = $1', [userId]),
      query('SELECT * FROM child_profiles WHERE user_id = $1', [userId]),
      safeQuery(
        `SELECT s.* FROM stories s
         JOIN child_profiles cp ON s.child_profile_id = cp.id
         WHERE cp.user_id = $1
         ORDER BY s.created_at DESC`,
        [userId]
      ),
      safeQuery(
        `SELECT j.* FROM journeys j
         JOIN child_profiles cp ON j.child_profile_id = cp.id
         WHERE cp.user_id = $1
         ORDER BY j.created_at DESC`,
        [userId]
      ),
      safeQuery(
        `SELECT js.* FROM journey_steps js
         JOIN journeys j ON js.journey_id = j.id
         JOIN child_profiles cp ON j.child_profile_id = cp.id
         WHERE cp.user_id = $1
         ORDER BY j.id, js.step_order`,
        [userId]
      ),
      safeQuery(
        `SELECT be.*, bd.name, bd.display_name, bd.description, bd.category, bd.badge_emoji
         FROM badges_earned be
         JOIN badge_definitions bd ON be.badge_definition_id = bd.id
         JOIN child_profiles cp ON be.child_profile_id = cp.id
         WHERE cp.user_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT mc.* FROM mood_checkins mc
         JOIN child_profiles cp ON mc.child_profile_id = cp.id
         WHERE cp.user_id = $1
         ORDER BY mc.created_at DESC`,
        [userId]
      ),
      safeQuery('SELECT * FROM family_members WHERE user_id = $1', [userId]),
      safeQuery(
        `SELECT vc.* FROM voice_clips vc
         WHERE vc.user_id = $1
         ORDER BY vc.created_at DESC`,
        [userId]
      ),
      safeQuery(
        `SELECT bm.* FROM buddy_messages bm
         JOIN child_profiles cp ON bm.child_profile_id = cp.id
         WHERE cp.user_id = $1
         ORDER BY bm.created_at ASC
         LIMIT 5000`,
        [userId]
      ),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: profileResult.rows[0] || null,
      children: childrenResult.rows,
      stories: storiesResult.rows,
      journeys: journeysResult.rows,
      journey_steps: journeyStepsResult.rows,
      badges: badgesResult.rows,
      mood_checkins: moodResult.rows,
      family_members: familyResult.rows,
      voice_clips: voiceClipsResult.rows,
      buddy_messages: buddyMessagesResult.rows,
      chat_messages: [],
    };

    const html = buildHtmlReport(exportData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="yoluno-data-${new Date().toISOString().split('T')[0]}.html"`
    );
    markExported(userId);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// ─── Granular export endpoints ───

const REPORT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #faf9f7; color: #2d2a26; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 2rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.4rem; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #3dd6c8; }
  h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; color: #555; }
  .subtitle { color: #7a7067; margin-bottom: 2rem; }
  .card { background: #fff; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(45,42,38,0.06); border: 1px solid #eee; }
  .meta { font-size: 0.85rem; color: #7a7067; }
  .message { padding: 0.6rem 1rem; border-radius: 12px; margin-bottom: 0.5rem; max-width: 80%; }
  .message-child { background: #3dd6c8; color: #fff; margin-left: auto; text-align: right; border-bottom-right-radius: 4px; }
  .message-buddy { background: #f0efed; color: #2d2a26; border-bottom-left-radius: 4px; }
  .message-time { font-size: 0.7rem; opacity: 0.7; margin-top: 2px; }
  .empty { color: #aaa; font-style: italic; padding: 1rem 0; }
  .stat-card { background: #fff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(45,42,38,0.06); border: 1px solid #eee; display: inline-block; margin-right: 1rem; margin-bottom: 1rem; min-width: 140px; }
  .stat-value { font-size: 2rem; font-weight: 700; color: #3dd6c8; }
  .stat-label { font-size: 0.85rem; color: #7a7067; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { color: #7a7067; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
  @media print { body { padding: 1rem; } .card { break-inside: avoid; } }
`;

function wrapHtml(title: string, subtitle: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escapeHtml(title)}</title><style>${REPORT_CSS}</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="subtitle">${escapeHtml(subtitle)}</p>
${body}
</body></html>`;
}

/**
 * GET /api/data-export/conversations
 * Export all chat sessions and messages as HTML.
 */
router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    if (!checkExportRateLimit(userId, 'conversations')) {
      res.status(429).json({ error: 'Export limit reached. Please wait 1 hour between exports.' });
      return;
    }

    const children = (await query('SELECT id, name FROM child_profiles WHERE user_id = $1', [userId])).rows;
    const childNames: Record<string, string> = {};
    for (const c of children) childNames[c.id] = c.name;

    const sessions = (await safeQuery(
      `SELECT cs.* FROM chat_sessions cs
       JOIN child_profiles cp ON cs.child_profile_id = cp.id
       WHERE cp.user_id = $1 ORDER BY cs.created_at DESC`,
      [userId]
    )).rows;

    const messages = (await safeQuery(
      `SELECT bm.* FROM buddy_messages bm
       JOIN child_profiles cp ON bm.child_profile_id = cp.id
       WHERE cp.user_id = $1 ORDER BY bm.created_at ASC`,
      [userId]
    )).rows;

    // Group messages by session
    const msgsBySession: Record<string, any[]> = {};
    for (const m of messages) {
      const sid = m.session_id || 'no-session';
      if (!msgsBySession[sid]) msgsBySession[sid] = [];
      msgsBySession[sid].push(m);
    }

    let body = `<div class="stat-card"><div class="stat-value">${sessions.length}</div><div class="stat-label">Sessions</div></div>`;
    body += `<div class="stat-card"><div class="stat-value">${messages.length}</div><div class="stat-label">Messages</div></div>`;

    for (const session of sessions) {
      const childName = childNames[session.child_profile_id] || 'Unknown';
      const msgs = msgsBySession[session.id] || [];
      body += `<h2>${escapeHtml(session.title || 'Untitled Session')} — ${escapeHtml(childName)}</h2>`;
      body += `<p class="meta">${formatDateTime(session.created_at)} · ${msgs.length} messages</p>`;
      if (msgs.length === 0) {
        body += `<p class="empty">No messages in this session.</p>`;
      } else {
        for (const m of msgs) {
          const cls = m.role === 'child' ? 'message-child' : 'message-buddy';
          body += `<div class="message ${cls}"><div>${escapeHtml(m.content)}</div><div class="message-time">${formatDateTime(m.created_at)}</div></div>`;
        }
      }
    }

    if (sessions.length === 0) body += `<p class="empty">No conversations found.</p>`;

    const html = wrapHtml(
      'Yoluno — Conversations Export',
      `Exported on ${formatDate(new Date().toISOString())}`,
      body
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="yoluno-conversations-${new Date().toISOString().split('T')[0]}.html"`);
    markExported(userId);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/data-export/stories
 * Export all stories with page content as HTML.
 */
router.get('/stories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    if (!checkExportRateLimit(userId, 'stories')) {
      res.status(429).json({ error: 'Export limit reached. Please wait 1 hour between exports.' });
      return;
    }

    const children = (await query('SELECT id, name FROM child_profiles WHERE user_id = $1', [userId])).rows;
    const childNames: Record<string, string> = {};
    for (const c of children) childNames[c.id] = c.name;

    const stories = (await safeQuery(
      `SELECT s.* FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE cp.user_id = $1 ORDER BY s.created_at DESC`,
      [userId]
    )).rows;

    const pages = (await safeQuery(
      `SELECT sp.* FROM story_pages sp
       JOIN stories s ON sp.story_id = s.id
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE cp.user_id = $1 ORDER BY sp.story_id, sp.page_number`,
      [userId]
    )).rows;

    const pagesByStory: Record<string, any[]> = {};
    for (const p of pages) {
      if (!pagesByStory[p.story_id]) pagesByStory[p.story_id] = [];
      pagesByStory[p.story_id].push(p);
    }

    let body = `<div class="stat-card"><div class="stat-value">${stories.length}</div><div class="stat-label">Stories</div></div>`;

    for (const story of stories) {
      const childName = childNames[story.child_profile_id] || 'Unknown';
      const storyPages = pagesByStory[story.id] || [];
      body += `<h2>${escapeHtml(story.title)}</h2>`;
      body += `<p class="meta">By ${escapeHtml(childName)} · ${formatDate(story.created_at)} · Theme: ${escapeHtml(story.theme || '—')} · Mood: ${escapeHtml(story.mood || '—')}</p>`;

      if (storyPages.length > 0) {
        for (const page of storyPages) {
          body += `<div class="card"><strong>Page ${page.page_number}</strong><p>${escapeHtml(page.content)}</p></div>`;
        }
      } else if (story.content) {
        body += `<div class="card"><p>${escapeHtml(story.content)}</p></div>`;
      }
    }

    if (stories.length === 0) body += `<p class="empty">No stories found.</p>`;

    const html = wrapHtml(
      'Yoluno — Stories Export',
      `Exported on ${formatDate(new Date().toISOString())}`,
      body
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="yoluno-stories-${new Date().toISOString().split('T')[0]}.html"`);
    markExported(userId);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/data-export/voice-recordings
 * Export voice recording metadata and URLs as HTML.
 */
router.get('/voice-recordings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    if (!checkExportRateLimit(userId, 'voice')) {
      res.status(429).json({ error: 'Export limit reached. Please wait 1 hour between exports.' });
      return;
    }

    const clips = (await safeQuery(
      `SELECT vc.* FROM voice_clips vc WHERE vc.user_id = $1 ORDER BY vc.created_at DESC`,
      [userId]
    )).rows;

    // Also include family member voice recordings
    const familyClips = (await safeQuery(
      `SELECT fm.name as member_name, fmr.* FROM family_member_recordings fmr
       JOIN family_members fm ON fmr.family_member_id = fm.id
       WHERE fm.user_id = $1 ORDER BY fmr.created_at DESC`,
      [userId]
    )).rows;

    let body = `<div class="stat-card"><div class="stat-value">${clips.length + familyClips.length}</div><div class="stat-label">Recordings</div></div>`;

    if (clips.length > 0) {
      body += `<h2>Voice Clips</h2>`;
      body += `<table><tr><th>Title</th><th>Category</th><th>Duration</th><th>Created</th></tr>`;
      for (const clip of clips) {
        body += `<tr><td>${escapeHtml(clip.title || '—')}</td><td>${escapeHtml(clip.category || '—')}</td><td>${clip.duration_seconds ? clip.duration_seconds + 's' : '—'}</td><td>${formatDate(clip.created_at)}</td></tr>`;
      }
      body += `</table>`;
    }

    if (familyClips.length > 0) {
      body += `<h2>Family Voice Recordings</h2>`;
      body += `<table><tr><th>Family Member</th><th>Label</th><th>Duration</th><th>Created</th></tr>`;
      for (const clip of familyClips) {
        body += `<tr><td>${escapeHtml(clip.member_name || '—')}</td><td>${escapeHtml(clip.label || '—')}</td><td>${clip.duration_seconds ? clip.duration_seconds + 's' : '—'}</td><td>${formatDate(clip.created_at)}</td></tr>`;
      }
      body += `</table>`;
    }

    if (clips.length === 0 && familyClips.length === 0) body += `<p class="empty">No voice recordings found.</p>`;

    const html = wrapHtml(
      'Yoluno — Voice Recordings Export',
      `Exported on ${formatDate(new Date().toISOString())}`,
      body
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="yoluno-voice-recordings-${new Date().toISOString().split('T')[0]}.html"`);
    markExported(userId);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/data-export/summary
 * Export a lightweight account summary as HTML.
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    if (!checkExportRateLimit(userId, 'summary')) {
      res.status(429).json({ error: 'Export limit reached. Please wait 1 hour between exports.' });
      return;
    }

    const user = (await query('SELECT id, email, email_verified, created_at FROM users WHERE id = $1', [userId])).rows[0];
    const children = (await query('SELECT * FROM child_profiles WHERE user_id = $1', [userId])).rows;

    const counts = await Promise.all([
      safeQuery('SELECT COUNT(*)::int as c FROM stories s JOIN child_profiles cp ON s.child_profile_id = cp.id WHERE cp.user_id = $1', [userId]),
      safeQuery('SELECT COUNT(*)::int as c FROM journeys j JOIN child_profiles cp ON j.child_profile_id = cp.id WHERE cp.user_id = $1', [userId]),
      safeQuery('SELECT COUNT(*)::int as c FROM buddy_messages bm JOIN child_profiles cp ON bm.child_profile_id = cp.id WHERE cp.user_id = $1', [userId]),
      safeQuery('SELECT COUNT(*)::int as c FROM family_members WHERE user_id = $1', [userId]),
      safeQuery('SELECT COUNT(*)::int as c FROM safety_reports WHERE user_id = $1', [userId]),
      safeQuery('SELECT COUNT(*)::int as c FROM badges_earned be JOIN child_profiles cp ON be.child_profile_id = cp.id WHERE cp.user_id = $1', [userId]),
    ]);

    const storyCount = counts[0].rows[0]?.c || 0;
    const journeyCount = counts[1].rows[0]?.c || 0;
    const messageCount = counts[2].rows[0]?.c || 0;
    const familyCount = counts[3].rows[0]?.c || 0;
    const reportCount = counts[4].rows[0]?.c || 0;
    const badgeCount = counts[5].rows[0]?.c || 0;

    let body = `
      <div class="stat-card"><div class="stat-value">${children.length}</div><div class="stat-label">Children</div></div>
      <div class="stat-card"><div class="stat-value">${storyCount}</div><div class="stat-label">Stories</div></div>
      <div class="stat-card"><div class="stat-value">${journeyCount}</div><div class="stat-label">Journeys</div></div>
      <div class="stat-card"><div class="stat-value">${messageCount}</div><div class="stat-label">Messages</div></div>
      <div class="stat-card"><div class="stat-value">${familyCount}</div><div class="stat-label">Family Members</div></div>
      <div class="stat-card"><div class="stat-value">${badgeCount}</div><div class="stat-label">Badges</div></div>
      <div class="stat-card"><div class="stat-value">${reportCount}</div><div class="stat-label">Safety Reports</div></div>
    `;

    body += `<h2>Account</h2><div class="card"><p><strong>Email:</strong> ${escapeHtml(user?.email || '—')}</p><p><strong>Account ID:</strong> ${user?.id || '—'}</p><p><strong>Created:</strong> ${formatDate(user?.created_at)}</p><p><strong>Email verified:</strong> ${user?.email_verified ? 'Yes' : 'No'}</p></div>`;

    body += `<h2>Children</h2>`;
    for (const child of children) {
      body += `<div class="card"><strong>${escapeHtml(child.name)}</strong><p class="meta">Age ${child.age} · ${child.gender || '—'}</p></div>`;
    }
    if (children.length === 0) body += `<p class="empty">No children profiles found.</p>`;

    const html = wrapHtml(
      'Yoluno — Account Summary',
      `Exported on ${formatDate(new Date().toISOString())} for ${escapeHtml(user?.email || '—')}`,
      body
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="yoluno-summary-${new Date().toISOString().split('T')[0]}.html"`);
    markExported(userId);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// ─── Delete endpoints ───

/**
 * DELETE /api/data-export/conversations
 * Permanently delete all chat sessions, messages, and safety reports for the user.
 * Requires confirmation text "DELETE" in the request body.
 */
router.delete('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      res.status(400).json({ error: 'Please type DELETE to confirm' });
      return;
    }

    // Delete messages first (references sessions), then sessions, then safety reports
    const msgResult = await query(
      `DELETE FROM buddy_messages bm
       USING child_profiles cp
       WHERE bm.child_profile_id = cp.id AND cp.user_id = $1`,
      [userId]
    );
    const sessionResult = await query(
      `DELETE FROM chat_sessions cs
       USING child_profiles cp
       WHERE cs.child_profile_id = cp.id AND cp.user_id = $1`,
      [userId]
    );
    await query('DELETE FROM safety_reports WHERE user_id = $1', [userId]);

    // Reset buddy message counts
    await safeQuery(
      `UPDATE chat_buddies cb SET message_count = 0, total_messages = 0
       FROM child_profiles cp
       WHERE cb.child_profile_id = cp.id AND cp.user_id = $1`,
      [userId]
    );

    markDeleted(userId, `Deleted all conversations (${msgResult.rowCount || 0} messages, ${sessionResult.rowCount || 0} sessions)`);

    res.json({
      deleted: {
        messages: msgResult.rowCount || 0,
        sessions: sessionResult.rowCount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/data-export/voice-recordings
 * Permanently delete all voice clips and family member recordings for the user.
 * Requires confirmation text "DELETE" in the request body.
 */
router.delete('/voice-recordings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      res.status(400).json({ error: 'Please type DELETE to confirm' });
      return;
    }

    // Delete voice clip tags first (FK to voice_clips)
    await safeQuery(
      `DELETE FROM voice_clip_tags vct
       USING voice_clips vc
       WHERE vct.voice_clip_id = vc.id AND vc.user_id = $1`,
      [userId]
    );

    const clipResult = await query(
      'DELETE FROM voice_clips WHERE user_id = $1',
      [userId]
    );

    // Delete family member recordings
    const famResult = await safeQuery(
      `DELETE FROM family_member_recordings fmr
       USING family_members fm
       WHERE fmr.family_member_id = fm.id AND fm.user_id = $1`,
      [userId]
    );

    markDeleted(userId, `Deleted all voice recordings (${clipResult.rowCount || 0} clips)`);

    res.json({
      deleted: {
        voice_clips: clipResult.rowCount || 0,
        family_recordings: famResult.rows ? (famResult as any).rowCount || 0 : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
