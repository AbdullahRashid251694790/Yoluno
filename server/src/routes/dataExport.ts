/**
 * Data Export Route
 *
 * Allows users to download all their data as JSON.
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
      activitiesResult,
      moodResult,
      familyResult,
      voiceClipsResult,
      chatMessagesResult,
      contentItemsResult,
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
        `SELECT be.*, bd.name, bd.display_name, bd.description, bd.category
         FROM badges_earned be
         JOIN badge_definitions bd ON be.badge_definition_id = bd.id
         JOIN child_profiles cp ON be.child_profile_id = cp.id
         WHERE cp.user_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT ca.*, at.name as activity_name, at.display_name as activity_display_name
         FROM child_activities ca
         JOIN activity_types at ON ca.activity_type_id = at.id
         JOIN child_profiles cp ON ca.child_profile_id = cp.id
         WHERE cp.user_id = $1
         ORDER BY ca.created_at DESC
         LIMIT 1000`,
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
        `SELECT cm.* FROM chat_messages cm
         JOIN chat_sessions cs ON cm.session_id = cs.id
         JOIN child_profiles cp ON cs.child_profile_id = cp.id
         WHERE cp.user_id = $1
         ORDER BY cm.created_at DESC
         LIMIT 5000`,
        [userId]
      ),
      safeQuery(
        `SELECT ci.* FROM content_items ci
         WHERE ci.user_id = $1
         ORDER BY ci.created_at DESC`,
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
      activities: activitiesResult.rows,
      mood_checkins: moodResult.rows,
      family_members: familyResult.rows,
      voice_clips: voiceClipsResult.rows,
      chat_messages: chatMessagesResult.rows,
      content_items: contentItemsResult.rows,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="yoluno-export-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

export default router;
