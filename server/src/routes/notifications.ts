import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

// Types
export type NotificationType = 'password_change_request' | 'other';

export interface ParentNotification {
  id: string;
  user_id: string;
  child_profile_id: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  read_at: Date | null;
}

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/notifications - Get all notifications for the authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0, unread_only } = req.query;

    let queryText = `
      SELECT pn.*, cp.name as child_name
      FROM parent_notifications pn
      LEFT JOIN child_profiles cp ON pn.child_profile_id = cp.id
      WHERE pn.user_id = $1
    `;
    const params: unknown[] = [req.user!.id];

    if (unread_only === 'true') {
      queryText += ' AND pn.is_read = false';
    }

    queryText += ' ORDER BY pn.created_at DESC LIMIT $2 OFFSET $3';
    params.push(Number(limit), Number(offset));

    const result = await query<ParentNotification & { child_name: string | null }>(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM parent_notifications WHERE user_id = $1 AND is_read = false',
      [req.user!.id]
    );

    res.json({ count: parseInt(result?.count || '0', 10) });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/:id/read - Mark a notification as read
router.post('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await queryOne<ParentNotification>(
      `UPDATE parent_notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user!.id]
    );

    if (!result) {
      throw new AppError(404, 'Notification not found');
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE parent_notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [req.user!.id]
    );

    res.json({ message: 'All notifications marked as read', count: result.rowCount });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'DELETE FROM parent_notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Notification not found');
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
