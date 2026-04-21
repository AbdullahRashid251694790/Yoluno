/**
 * Topics Routes
 *
 * Content topics management for parent controls.
 * All data from database - no hardcoding.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateBody } from '../utils/validation.js';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Types
interface TopicCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

interface Topic {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  age_appropriate_min: number;
  age_appropriate_max: number;
  is_default: boolean;
}

interface ChildTopicSetting {
  id: string;
  child_profile_id: string;
  topic_id: string;
  is_allowed: boolean;
  created_at: string;
}

// Validation schemas
const updateTopicSettingSchema = z.object({
  is_allowed: z.boolean(),
});

const createCustomTopicSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
});

const updateCustomTopicSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
  is_active: z.boolean().optional(),
});

const createTopicPostSchema = z.object({
  topic_id: z.string().uuid().optional(),
  custom_topic_id: z.string().uuid().optional(),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  sort_order: z.number().int().optional().default(0),
}).refine(
  (data) => (data.topic_id && !data.custom_topic_id) || (!data.topic_id && data.custom_topic_id),
  { message: 'Exactly one of topic_id or custom_topic_id must be provided' }
);

const updateTopicPostSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

// Additional types
interface CustomTopic {
  id: string;
  child_profile_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TopicPost {
  id: string;
  child_profile_id: string;
  topic_id: string | null;
  custom_topic_id: string | null;
  title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/topics/categories
 * Get all topic categories with their topics
 */
router.get(
  '/categories',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get all categories
      const categoriesResult = await query<TopicCategory>(
        `SELECT id, name, description, icon, sort_order
        FROM topic_categories
        ORDER BY sort_order, name`
      );

      // Get all topics
      const topicsResult = await query<Topic>(
        `SELECT id, category_id, name, description,
                age_appropriate_min, age_appropriate_max, is_default
        FROM topics
        ORDER BY name`
      );

      const categories = categoriesResult.rows;
      const topics = topicsResult.rows;

      // Group topics by category
      const categoriesWithTopics = categories.map((category) => ({
        ...category,
        topics: topics.filter((t) => t.category_id === category.id),
      }));

      // Add uncategorized topics
      const uncategorizedTopics = topics.filter((t) => !t.category_id);
      if (uncategorizedTopics.length > 0) {
        categoriesWithTopics.push({
          id: 'uncategorized',
          name: 'Other',
          description: 'Miscellaneous topics',
          icon: null,
          sort_order: 999,
          topics: uncategorizedTopics,
        } as TopicCategory & { topics: Topic[] });
      }

      res.json(categoriesWithTopics);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/topics/child/:childId
 * Get topic settings for a specific child
 */
router.get(
  '/child/:childId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string; age: number }>(
        'SELECT id, age FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Get all topics appropriate for child's age
      const topicsResult = await query<Topic & { category_name: string }>(
        `SELECT t.id, t.category_id, t.name, t.description,
                t.age_appropriate_min, t.age_appropriate_max, t.is_default,
                tc.name as category_name
        FROM topics t
        LEFT JOIN topic_categories tc ON t.category_id = tc.id
        WHERE t.age_appropriate_min <= $1 AND t.age_appropriate_max >= $1
        ORDER BY tc.sort_order, t.name`,
        [child.age]
      );

      // Get child's topic settings
      const settingsResult = await query<ChildTopicSetting>(
        `SELECT id, child_profile_id, topic_id, is_allowed, created_at::text
        FROM child_topic_settings
        WHERE child_profile_id = $1`,
        [childId]
      );

      // Build settings map
      const settingsMap = new Map(settingsResult.rows.map((s) => [s.topic_id, s.is_allowed]));

      // Merge topics with settings (default to is_default if no setting)
      const topicsWithSettings = topicsResult.rows.map((topic) => ({
        ...topic,
        is_allowed: settingsMap.has(topic.id)
          ? settingsMap.get(topic.id)
          : topic.is_default,
      }));

      res.json({
        child_id: childId,
        child_age: child.age,
        topics: topicsWithSettings,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/topics/child/:childId/:topicId
 * Update topic setting for a child
 */
router.put(
  '/child/:childId/:topicId',
  validateBody(updateTopicSettingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId, topicId } = req.params;
      const { is_allowed } = req.body;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Verify topic exists
      const topic = await queryOne<{ id: string }>(
        'SELECT id FROM topics WHERE id = $1',
        [topicId]
      );
      if (!topic) {
        throw new AppError(404, 'Topic not found');
      }

      // Upsert the setting
      const result = await queryOne<ChildTopicSetting>(
        `INSERT INTO child_topic_settings (child_profile_id, topic_id, is_allowed)
        VALUES ($1, $2, $3)
        ON CONFLICT (child_profile_id, topic_id)
        DO UPDATE SET is_allowed = EXCLUDED.is_allowed
        RETURNING id, child_profile_id, topic_id, is_allowed, created_at::text`,
        [childId, topicId, is_allowed]
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/topics/child/:childId/bulk
 * Bulk update topic settings for a child
 */
router.post(
  '/child/:childId/bulk',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const { settings } = req.body as { settings: Array<{ topic_id: string; is_allowed: boolean }> };
      const userId = req.user!.id;

      if (!Array.isArray(settings)) {
        throw new AppError(400, 'Settings must be an array');
      }

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Upsert all settings
      for (const setting of settings) {
        await query(
          `INSERT INTO child_topic_settings (child_profile_id, topic_id, is_allowed)
          VALUES ($1, $2, $3)
          ON CONFLICT (child_profile_id, topic_id)
          DO UPDATE SET is_allowed = EXCLUDED.is_allowed`,
          [childId, setting.topic_id, setting.is_allowed]
        );
      }

      res.json({ message: 'Settings updated', count: settings.length });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// Custom Topics CRUD
// ============================================

/**
 * GET /api/topics/child/:childId/custom
 * Get all custom topics for a child
 */
router.get(
  '/child/:childId/custom',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      const result = await query<CustomTopic>(
        `SELECT id, child_profile_id, name, description, icon, is_active,
                created_at::text, updated_at::text
         FROM custom_topics
         WHERE child_profile_id = $1
         ORDER BY name`,
        [childId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/topics/child/:childId/custom
 * Create a custom topic for a child
 */
router.post(
  '/child/:childId/custom',
  validateBody(createCustomTopicSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const { name, description, icon } = req.body;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      const result = await queryOne<CustomTopic>(
        `INSERT INTO custom_topics (child_profile_id, name, description, icon)
         VALUES ($1, $2, $3, $4)
         RETURNING id, child_profile_id, name, description, icon, is_active,
                   created_at::text, updated_at::text`,
        [childId, name, description || null, icon || null]
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      // Handle unique constraint violation
      if ((error as { code?: string }).code === '23505') {
        next(new AppError(400, 'A topic with this name already exists for this child'));
        return;
      }
      next(error);
    }
  }
);

/**
 * PUT /api/topics/child/:childId/custom/:customTopicId
 * Update a custom topic
 */
router.put(
  '/child/:childId/custom/:customTopicId',
  validateBody(updateCustomTopicSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId, customTopicId } = req.params;
      const { name, description, icon, is_active } = req.body;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Verify custom topic exists and belongs to child
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM custom_topics WHERE id = $1 AND child_profile_id = $2',
        [customTopicId, childId]
      );
      if (!existing) {
        throw new AppError(404, 'Custom topic not found');
      }

      // Build dynamic update
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (icon !== undefined) {
        updates.push(`icon = $${paramCount++}`);
        values.push(icon);
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(is_active);
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No fields to update');
      }

      values.push(customTopicId);

      const result = await queryOne<CustomTopic>(
        `UPDATE custom_topics
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, child_profile_id, name, description, icon, is_active,
                   created_at::text, updated_at::text`,
        values
      );

      res.json(result);
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        next(new AppError(400, 'A topic with this name already exists for this child'));
        return;
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/topics/child/:childId/custom/:customTopicId
 * Delete a custom topic (and its posts via cascade)
 */
router.delete(
  '/child/:childId/custom/:customTopicId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId, customTopicId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      const result = await query(
        'DELETE FROM custom_topics WHERE id = $1 AND child_profile_id = $2',
        [customTopicId, childId]
      );

      if (result.rowCount === 0) {
        throw new AppError(404, 'Custom topic not found');
      }

      res.json({ message: 'Custom topic deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// Topic Posts CRUD
// ============================================

/**
 * GET /api/topics/child/:childId/posts
 * Get all topic posts for a child (both system and custom topics)
 */
router.get(
  '/child/:childId/posts',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      const result = await query<TopicPost & { topic_name: string | null; custom_topic_name: string | null }>(
        `SELECT tp.id, tp.child_profile_id, tp.topic_id, tp.custom_topic_id,
                tp.title, tp.content, tp.sort_order, tp.is_active,
                tp.created_at::text, tp.updated_at::text,
                t.name as topic_name,
                ct.name as custom_topic_name
         FROM topic_posts tp
         LEFT JOIN topics t ON tp.topic_id = t.id
         LEFT JOIN custom_topics ct ON tp.custom_topic_id = ct.id
         WHERE tp.child_profile_id = $1
         ORDER BY tp.sort_order, tp.created_at`,
        [childId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/topics/child/:childId/posts
 * Create a topic post
 */
router.post(
  '/child/:childId/posts',
  validateBody(createTopicPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const { topic_id, custom_topic_id, title, content, sort_order } = req.body;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Verify the topic exists
      if (topic_id) {
        const topic = await queryOne<{ id: string }>(
          'SELECT id FROM topics WHERE id = $1',
          [topic_id]
        );
        if (!topic) {
          throw new AppError(404, 'Topic not found');
        }
      } else if (custom_topic_id) {
        const customTopic = await queryOne<{ id: string }>(
          'SELECT id FROM custom_topics WHERE id = $1 AND child_profile_id = $2',
          [custom_topic_id, childId]
        );
        if (!customTopic) {
          throw new AppError(404, 'Custom topic not found');
        }
      }

      const result = await queryOne<TopicPost>(
        `INSERT INTO topic_posts (child_profile_id, topic_id, custom_topic_id, title, content, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, child_profile_id, topic_id, custom_topic_id, title, content,
                   sort_order, is_active, created_at::text, updated_at::text`,
        [childId, topic_id || null, custom_topic_id || null, title, content, sort_order || 0]
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/topics/child/:childId/posts/:postId
 * Update a topic post
 */
router.put(
  '/child/:childId/posts/:postId',
  validateBody(updateTopicPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId, postId } = req.params;
      const { title, content, sort_order, is_active } = req.body;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      // Verify post exists and belongs to child
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM topic_posts WHERE id = $1 AND child_profile_id = $2',
        [postId, childId]
      );
      if (!existing) {
        throw new AppError(404, 'Topic post not found');
      }

      // Build dynamic update
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramCount++}`);
        values.push(content);
      }
      if (sort_order !== undefined) {
        updates.push(`sort_order = $${paramCount++}`);
        values.push(sort_order);
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(is_active);
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No fields to update');
      }

      values.push(postId);

      const result = await queryOne<TopicPost>(
        `UPDATE topic_posts
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, child_profile_id, topic_id, custom_topic_id, title, content,
                   sort_order, is_active, created_at::text, updated_at::text`,
        values
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/topics/child/:childId/posts/:postId
 * Delete a topic post
 */
router.delete(
  '/child/:childId/posts/:postId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId, postId } = req.params;
      const userId = req.user!.id;

      // Verify child belongs to user
      const child = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE id = $1 AND user_id = $2',
        [childId, userId]
      );
      if (!child) {
        throw new AppError(404, 'Child profile not found');
      }

      const result = await query(
        'DELETE FROM topic_posts WHERE id = $1 AND child_profile_id = $2',
        [postId, childId]
      );

      if (result.rowCount === 0) {
        throw new AppError(404, 'Topic post not found');
      }

      res.json({ message: 'Topic post deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/topics/posts/generate - Generate a topic post with AI
const generatePostSchema = z.object({
  topicName: z.string().min(1, 'Topic name is required'),
  childAge: z.number().min(3).max(14).optional(),
});

router.post(
  '/posts/generate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topicName, childAge = 7 } = validateBody(generatePostSchema, req.body);

      // Age-bracket language guidance
      const ageGuidance = childAge <= 6
        ? 'Use very simple words (1-2 syllables). Short sentences. Lots of wonder and imagination. Think picture-book level.'
        : childAge <= 9
        ? 'Use clear, friendly language. Explain bigger words naturally. Balance fun with learning. Think early chapter-book level.'
        : 'Use mature, respectful language. Real vocabulary with explanations where needed. Challenge thinking. Think encyclopedia-for-kids level.';

      const systemPrompt = `You are an expert children's educator creating content for a ${childAge}-year-old.

CONTENT GUARDRAILS — STRICT:
- NEVER include violence, weapons, gore, or graphic descriptions
- NEVER include sexual content, innuendo, or adult themes
- NEVER include discriminatory, racist, or biased content
- NEVER include religious or political opinions — present facts neutrally
- NEVER include content that could cause fear, anxiety, or nightmares
- NEVER include dangerous activities children might imitate (mixing chemicals, fire, etc.)
- NEVER include profanity, slang, or inappropriate humor
- If the topic touches on sensitive subjects (war, death, illness), frame it with care, hope, and age-appropriate honesty
- All facts must be scientifically accurate and verifiable — do NOT make up statistics or claims

AGE-APPROPRIATE LANGUAGE:
${ageGuidance}

EDUCATIONAL QUALITY:
- Content must teach something real and valuable — not just trivia
- Include context that helps the child understand WHY something matters
- Spark curiosity with questions or "did you know" moments
- Be engaging, warm, and encouraging — never dry or textbook-like

OUTPUT FORMAT:
Generate a structured mini-lesson. Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "title": "A short, catchy title (5-8 words)",
  "content": "A structured lesson using markdown formatting (500-1000 words)"
}

The "content" field MUST follow this structure using markdown:
1. Start with a 2-3 sentence introduction explaining what the topic is and why it matters
2. Then a section titled **Key Concepts** with 3-5 numbered items, each with a **bold term** followed by a clear explanation
3. Then a section titled **Fun Facts** with 3-4 bullet points of surprising, real facts
4. End with a section titled **Try This!** with 2-3 bullet points of hands-on activities or thought experiments the child can do

Use **bold** for key terms. Use numbered lists (1. 2. 3.) for key concepts. Use bullet points (-) for facts and activities. Use blank lines between sections.`;

      const userPrompt = `Generate a comprehensive educational mini-lesson about: ${topicName}
Target age: ${childAge} years old.
Aim for 500-1000 words of real, structured educational content.

Remember: Respond with ONLY the JSON object, no other text.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 2000,
          temperature: 0.5,
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', errorText);
        throw new AppError(500, 'Failed to generate content');
      }

      const data = (await response.json()) as { choices: { message: { content: string } }[] };
      const text = data.choices[0]?.message?.content || '';

      // Parse JSON response
      try {
        // Strip markdown code fences and any surrounding whitespace
        let cleanedText = text.replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '').replace(/\n?\s*```[\s\S]*$/, '').trim();
        // If no code fences were found, try the raw text
        if (!cleanedText.startsWith('{')) {
          cleanedText = text.trim();
        }
        // Extract the JSON object between first { and last }
        const firstBrace = cleanedText.indexOf('{');
        const lastBrace = cleanedText.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error('No JSON object found');
        }
        const jsonStr = cleanedText.substring(firstBrace, lastBrace + 1);
        const generated = JSON.parse(jsonStr) as { title: string; content: string };

        if (!generated.title || !generated.content) {
          throw new Error('Invalid response structure');
        }

        res.json({
          title: generated.title,
          content: generated.content,
        });
      } catch (parseError) {
        console.error('Failed to parse AI response:', text.substring(0, 500));
        throw new AppError(500, 'Failed to parse generated content');
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
