import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ChildProfile } from '../types/index.js';

const router = Router();

router.use(requireAuth);

interface JourneyReward {
  id: string;
  child_profile_id: string;
  journey_id: string;
  reward_image_url: string;
  reward_title: string;
  earned_at: string;
  viewed: boolean;
}

async function verifyChildAccess(childId: string, userId: string): Promise<void> {
  const child = await queryOne<ChildProfile>(
    'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  if (!child) {
    throw new AppError(403, 'Access denied to child profile');
  }
}

// GET /api/journey-rewards/:childId - Get all earned rewards for child
router.get('/:childId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const result = await query<JourneyReward & { journey_title: string; badge_emoji: string }>(
      `SELECT jr.*, j.title as journey_title, COALESCE(j.badge_emoji, '🏆') as badge_emoji
       FROM journey_rewards jr
       LEFT JOIN journeys j ON jr.journey_id = j.id
       WHERE jr.child_profile_id = $1
       ORDER BY jr.earned_at DESC`,
      [req.params.childId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-rewards/:childId/unviewed - Get unviewed rewards
router.get('/:childId/unviewed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const result = await query<JourneyReward & { journey_title: string; badge_emoji: string }>(
      `SELECT jr.*, j.title as journey_title, COALESCE(j.badge_emoji, '🏆') as badge_emoji
       FROM journey_rewards jr
       LEFT JOIN journeys j ON jr.journey_id = j.id
       WHERE jr.child_profile_id = $1 AND jr.viewed = false
       ORDER BY jr.earned_at DESC`,
      [req.params.childId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-rewards/:childId/count - Get reward counts
router.get('/:childId/count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyChildAccess(req.params.childId, req.user!.id);

    const result = await queryOne<{ total: string; unviewed: string }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE viewed = false) as unviewed
       FROM journey_rewards
       WHERE child_profile_id = $1`,
      [req.params.childId]
    );

    res.json({
      total: parseInt(result?.total || '0', 10),
      unviewed: parseInt(result?.unviewed || '0', 10),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/journey-rewards/:rewardId/viewed - Mark reward as viewed
router.put('/:rewardId/viewed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify access through child profile
    const reward = await queryOne<JourneyReward & { user_id: string }>(
      `SELECT jr.*, cp.user_id FROM journey_rewards jr
       JOIN child_profiles cp ON jr.child_profile_id = cp.id
       WHERE jr.id = $1`,
      [req.params.rewardId]
    );

    if (!reward) {
      throw new AppError(404, 'Reward not found');
    }

    if (reward.user_id !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    await query(
      'UPDATE journey_rewards SET viewed = true WHERE id = $1',
      [req.params.rewardId]
    );

    res.json({ message: 'Reward marked as viewed' });
  } catch (error) {
    next(error);
  }
});

// POST /api/journey-rewards/award - Award a reward (internal use, called when journey completes)
router.post('/award', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { child_profile_id, journey_id } = req.body;

    await verifyChildAccess(child_profile_id, req.user!.id);

    // Check if reward already exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM journey_rewards WHERE child_profile_id = $1 AND journey_id = $2',
      [child_profile_id, journey_id]
    );

    if (existing) {
      throw new AppError(400, 'Reward already awarded for this journey');
    }

    // Get journey and template info
    const journey = await queryOne<{
      id: string;
      title: string;
      template_id: string | null;
    }>(
      'SELECT id, title, template_id FROM journeys WHERE id = $1',
      [journey_id]
    );

    if (!journey) {
      throw new AppError(404, 'Journey not found');
    }

    // Get reward image from template
    let rewardImageUrl = '/images/default-reward.png'; // Default fallback

    if (journey.template_id) {
      const template = await queryOne<{ reward_image_url: string | null }>(
        'SELECT reward_image_url FROM journey_templates WHERE id = $1',
        [journey.template_id]
      );
      if (template?.reward_image_url) {
        rewardImageUrl = template.reward_image_url;
      }
    }

    // Create reward
    const reward = await queryOne<JourneyReward>(
      `INSERT INTO journey_rewards
       (id, child_profile_id, journey_id, reward_image_url, reward_title, viewed)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [uuidv4(), child_profile_id, journey_id, rewardImageUrl, journey.title]
    );

    res.status(201).json(reward);
  } catch (error) {
    next(error);
  }
});

// GET /api/journey-rewards/all - Get all rewards across all children (parent overview)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<JourneyReward & { journey_title: string; child_name: string }>(
      `SELECT jr.*, j.title as journey_title, cp.name as child_name
       FROM journey_rewards jr
       LEFT JOIN journeys j ON jr.journey_id = j.id
       JOIN child_profiles cp ON jr.child_profile_id = cp.id
       WHERE cp.user_id = $1
       ORDER BY jr.earned_at DESC`,
      [req.user!.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
