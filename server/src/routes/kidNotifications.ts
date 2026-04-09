/**
 * Kid Notifications Routes
 *
 * CRUD operations for child-facing notifications.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth);

interface KidNotification {
  id: string;
  child_profile_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  metadata: Record<string, unknown>;
}

// GET /api/kids/:childId/notifications
router.get('/:childId/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unread_only === 'true';

    // Verify child belongs to user
    const child = await queryOne<{ id: string }>(
      'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
      [childId, req.user!.id]
    );
    if (!child) throw new AppError(404, 'Child profile not found');

    const whereClause = unreadOnly
      ? 'WHERE child_profile_id = $1 AND is_read = false'
      : 'WHERE child_profile_id = $1';

    const result = await query<KidNotification>(
      `SELECT * FROM kid_notifications ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [childId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/kids/:childId/notifications/unread-count
router.get('/:childId/notifications/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;

    const child = await queryOne<{ id: string }>(
      'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
      [childId, req.user!.id]
    );
    if (!child) throw new AppError(404, 'Child profile not found');

    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM kid_notifications WHERE child_profile_id = $1 AND is_read = false',
      [childId]
    );

    res.json({ count: parseInt(result?.count || '0') });
  } catch (error) {
    next(error);
  }
});

// POST /api/kids/:childId/notifications/:id/read
router.post('/:childId/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, id } = req.params;

    const notification = await queryOne<KidNotification>(
      `UPDATE kid_notifications SET is_read = true, read_at = NOW()
       WHERE id = $1 AND child_profile_id = $2
       RETURNING *`,
      [id, childId]
    );

    if (!notification) throw new AppError(404, 'Notification not found');
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

// POST /api/kids/:childId/notifications/read-all
router.post('/:childId/notifications/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;

    const result = await query(
      `UPDATE kid_notifications SET is_read = true, read_at = NOW()
       WHERE child_profile_id = $1 AND is_read = false`,
      [childId]
    );

    res.json({ message: 'All notifications marked as read', count: result.rowCount });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/kids/:childId/notifications/:id
router.delete('/:childId/notifications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, id } = req.params;

    const result = await query(
      'DELETE FROM kid_notifications WHERE id = $1 AND child_profile_id = $2',
      [id, childId]
    );

    if (result.rowCount === 0) throw new AppError(404, 'Notification not found');
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
