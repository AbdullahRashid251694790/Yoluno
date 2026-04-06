/**
 * Data Export Route
 *
 * Allows users to download all their data as a styled HTML report.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

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
    res.send(html);
  } catch (error) {
    next(error);
  }
});

export default router;
