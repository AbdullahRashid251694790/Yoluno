/**
 * Gamification Helper
 *
 * Shared functions for logging activities and awarding badges.
 * Used by both the gamification route and buddyChat for journey completion.
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction, PoolClient } from '../config/database.js';

// Types
export interface ActivityType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  points_value: number;
  icon_name: string | null;
  category: string;
  is_active: boolean;
}

export interface ChildStats {
  id: string;
  child_profile_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_activities: number;
  total_stories: number;
  total_journeys_completed: number;
  total_chat_messages: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon_url: string;
  requirement_type: string;
  requirement_value: number;
  sort_order: number;
  is_active: boolean;
}

export interface LogActivityResult {
  pointsEarned: number;
  newBadges: BadgeDefinition[];
  newStreak: number;
  stats: ChildStats;
}

/**
 * Calculate streak from streak_history
 */
async function calculateStreak(client: PoolClient, childId: string): Promise<number> {
  const result = await client.query<{ streak: number }>(
    `WITH consecutive_days AS (
       SELECT activity_date,
              activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int AS grp
       FROM streak_history
       WHERE child_profile_id = $1
       ORDER BY activity_date DESC
     )
     SELECT COUNT(*)::integer as streak
     FROM consecutive_days
     WHERE grp = (SELECT grp FROM consecutive_days LIMIT 1)`,
    [childId]
  );
  return result.rows[0]?.streak || 0;
}

/**
 * Check and award badges based on current stats
 */
async function checkAndAwardBadges(
  client: PoolClient,
  childId: string,
  stats: ChildStats
): Promise<BadgeDefinition[]> {
  const newBadges: BadgeDefinition[] = [];

  // Get all unearned active badges
  const unearnedResult = await client.query<BadgeDefinition>(
    `SELECT bd.* FROM badge_definitions bd
     WHERE bd.is_active = true
     AND NOT EXISTS (
       SELECT 1 FROM badges_earned be
       WHERE be.badge_definition_id = bd.id AND be.child_profile_id = $1
     )`,
    [childId]
  );

  for (const badge of unearnedResult.rows) {
    let earned = false;

    switch (badge.requirement_type) {
      case 'streak':
        earned = stats.current_streak >= badge.requirement_value;
        break;
      case 'points':
        earned = stats.total_points >= badge.requirement_value;
        break;
      case 'activity_count':
        // Check based on badge name pattern
        if (badge.name.includes('chat')) {
          earned = stats.total_chat_messages >= badge.requirement_value;
        } else if (badge.name.includes('story')) {
          earned = stats.total_stories >= badge.requirement_value;
        } else if (badge.name.includes('journey_finisher') || badge.name.includes('journey_explorer')) {
          earned = stats.total_journeys_completed >= badge.requirement_value;
        } else if (badge.name.includes('journey')) {
          earned = stats.total_activities >= badge.requirement_value;
        } else {
          earned = stats.total_activities >= badge.requirement_value;
        }
        break;
    }

    if (earned) {
      await client.query(
        `INSERT INTO badges_earned (id, child_profile_id, badge_definition_id, notified)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (child_profile_id, badge_definition_id) DO NOTHING`,
        [uuidv4(), childId, badge.id]
      );
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Award the journey-specific completion badge for a given journey.
 * For template journeys: matches the seeded badge definition via template_id.
 * For custom journeys: matches a badge definition created at journey-creation time.
 * Returns the awarded badge, or null if already earned / not found.
 */
export async function awardJourneyCompletionBadge(
  childId: string,
  journeyId: string
): Promise<BadgeDefinition | null> {
  try {
    const journey = await queryOne<{ template_id: string | null; badge_emoji: string; title: string }>(
      'SELECT template_id, badge_emoji, title FROM journeys WHERE id = $1',
      [journeyId]
    );
    if (!journey) return null;

    let badgeDef: BadgeDefinition | null = null;

    if (journey.template_id) {
      badgeDef = await queryOne<BadgeDefinition>(
        `SELECT * FROM badge_definitions
         WHERE requirement_type = 'journey_template_completion'
         AND requirement_metadata->>'template_id' = $1
         AND is_active = true`,
        [journey.template_id]
      );
    } else {
      // Custom journey — badge definition was created when journey was created
      badgeDef = await queryOne<BadgeDefinition>(
        `SELECT * FROM badge_definitions
         WHERE requirement_type = 'journey_custom_completion'
         AND requirement_metadata->>'journey_id' = $1
         AND is_active = true`,
        [journeyId]
      );
    }

    if (!badgeDef) return null;

    // Check if already earned
    const alreadyEarned = await queryOne<{ id: string }>(
      'SELECT id FROM badges_earned WHERE child_profile_id = $1 AND badge_definition_id = $2',
      [childId, badgeDef.id]
    );
    if (alreadyEarned) return null;

    await query(
      `INSERT INTO badges_earned (id, child_profile_id, badge_definition_id, notified)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (child_profile_id, badge_definition_id) DO NOTHING`,
      [uuidv4(), childId, badgeDef.id]
    );

    return badgeDef;
  } catch (error) {
    console.error('Error awarding journey completion badge:', error);
    return null;
  }
}

/**
 * Log an activity for a child and check for badge awards
 * Used internally by buddyChat and other services
 */
export async function logActivityForChild(
  childId: string,
  activityTypeName: string,
  metadata?: Record<string, unknown>
): Promise<LogActivityResult | null> {
  try {
    // Get activity type from database
    const activityType = await queryOne<ActivityType>(
      'SELECT * FROM activity_types WHERE name = $1 AND is_active = true',
      [activityTypeName]
    );

    if (!activityType) {
      console.error(`Invalid activity type: ${activityTypeName}`);
      return null;
    }

    const result = await withTransaction(async (client) => {
      const today = new Date().toISOString().split('T')[0];

      // 1. Log the activity
      await client.query(
        `INSERT INTO child_activities (id, child_profile_id, activity_type_id, points_earned, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), childId, activityType.id, activityType.points_value, metadata || {}]
      );

      // 2. Update streak history
      await client.query(
        `INSERT INTO streak_history (id, child_profile_id, activity_date, activity_count)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (child_profile_id, activity_date)
         DO UPDATE SET activity_count = streak_history.activity_count + 1`,
        [uuidv4(), childId, today]
      );

      // 3. Calculate current streak
      const currentStreak = await calculateStreak(client, childId);

      // 4. Build stats update based on activity category
      const statsIncrement: Record<string, number> = {
        total_points: activityType.points_value,
        total_activities: 1,
        total_stories: 0,
        total_journeys_completed: 0,
        total_chat_messages: 0,
      };

      if (activityType.category === 'chat') {
        statsIncrement.total_chat_messages = 1;
      } else if (activityType.category === 'story' && activityTypeName === 'story_created') {
        statsIncrement.total_stories = 1;
      } else if (activityTypeName === 'journey_completed') {
        statsIncrement.total_journeys_completed = 1;
      }

      // 5. Update child stats (create if not exists)
      await client.query(
        `INSERT INTO child_stats (id, child_profile_id, total_points, current_streak, longest_streak,
           last_activity_date, total_activities, total_stories, total_journeys_completed, total_chat_messages)
         VALUES ($1, $2, 0, 0, 0, NULL, 0, 0, 0, 0)
         ON CONFLICT (child_profile_id) DO NOTHING`,
        [uuidv4(), childId]
      );

      const statsResult = await client.query<ChildStats>(
        `UPDATE child_stats
         SET total_points = total_points + $1,
             current_streak = $2,
             longest_streak = GREATEST(longest_streak, $2),
             last_activity_date = $3,
             total_activities = total_activities + $4,
             total_stories = total_stories + $5,
             total_journeys_completed = total_journeys_completed + $6,
             total_chat_messages = total_chat_messages + $7,
             updated_at = NOW()
         WHERE child_profile_id = $8
         RETURNING *`,
        [
          statsIncrement.total_points,
          currentStreak,
          today,
          statsIncrement.total_activities,
          statsIncrement.total_stories,
          statsIncrement.total_journeys_completed,
          statsIncrement.total_chat_messages,
          childId,
        ]
      );

      const updatedStats = statsResult.rows[0];

      // 6. Check for new badges
      const newBadges = await checkAndAwardBadges(client, childId, updatedStats);

      return {
        pointsEarned: activityType.points_value,
        newBadges,
        newStreak: currentStreak,
        stats: updatedStats,
      };
    });

    return result;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}
