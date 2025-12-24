import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Story, ChildProfile, FamilyMember, StoryPage } from '../types/index.js';

const router = Router();

router.use(requireAuth);

// POST /api/generate-story
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      child_profile_id,
      theme,
      characters,
      mood,
      values,
      storyLength = 'medium',
      includeFamily = false,
      narratorVoice = 'nova',
    } = req.body;

    // Verify child access
    const child = await queryOne<ChildProfile>(
      'SELECT * FROM child_profiles WHERE id = $1 AND user_id = $2',
      [child_profile_id, req.user!.id]
    );

    if (!child) {
      throw new AppError(403, 'Access denied to child profile');
    }

    // Get family members if requested
    let familyMembers: FamilyMember[] = [];
    if (includeFamily) {
      const result = await query<FamilyMember>(
        'SELECT name, relationship FROM family_members WHERE user_id = $1 LIMIT 5',
        [req.user!.id]
      );
      familyMembers = result.rows;
    }

    // Determine page count and word count based on age and length
    const pageConfigs: Record<string, { pages: number; wordsPerPage: number }> = {
      short: { pages: child.age < 6 ? 5 : 5, wordsPerPage: child.age < 6 ? 30 : 50 },
      medium: { pages: child.age < 6 ? 6 : 6, wordsPerPage: child.age < 6 ? 50 : 80 },
      long: { pages: child.age < 6 ? 8 : 8, wordsPerPage: child.age < 6 ? 60 : 100 },
    };
    const config = pageConfigs[storyLength] || pageConfigs.medium;

    // Generate story with pages
    const storyContent = await generateStoryWithPages({
      childName: child.name,
      childAge: child.age,
      theme,
      characters,
      mood,
      values,
      pageCount: config.pages,
      wordsPerPage: config.wordsPerPage,
      familyMembers,
      interests: child.interests || [],
    });

    // Generate cover illustration
    let coverImageUrl: string | null = null;
    try {
      coverImageUrl = await generateIllustration(
        `Cover image for "${storyContent.title}"`,
        theme,
        mood,
        child_profile_id,
        'cover'
      );
    } catch (error) {
      console.error('Failed to generate cover illustration:', error);
    }

    // Save story to database
    const storyId = uuidv4();
    const story = await queryOne<Story>(
      `INSERT INTO stories (
        id, child_profile_id, title, content, theme, mood,
        values, word_count, cover_image_url, has_pages, narrator_voice
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        storyId,
        child_profile_id,
        storyContent.title,
        storyContent.fullContent,
        theme,
        mood,
        values,
        storyContent.wordCount,
        coverImageUrl,
        true,
        narratorVoice,
      ]
    );

    // Save pages to database
    for (let i = 0; i < storyContent.pages.length; i++) {
      const page = storyContent.pages[i];
      await queryOne<StoryPage>(
        `INSERT INTO story_pages (
          id, story_id, page_number, content, illustration_prompt, illustration_status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          uuidv4(),
          storyId,
          i + 1,
          page.content,
          page.illustrationPrompt,
          'pending',
        ]
      );
    }

    // Start generating illustrations in the background
    generatePageIllustrations(storyId, child_profile_id).catch((error) => {
      console.error('Background illustration generation failed:', error);
    });

    res.status(201).json({
      story: {
        ...story,
        pages: storyContent.pages.map((p, i) => ({
          page_number: i + 1,
          content: p.content,
          illustration_status: 'pending',
        })),
      },
      warning: coverImageUrl ? null : 'Cover illustration generation failed',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/generate-story/:storyId/pages
router.get('/:storyId/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyId } = req.params;

    // Verify story access
    const story = await queryOne<Story>(
      `SELECT s.* FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE s.id = $1 AND cp.user_id = $2`,
      [storyId, req.user!.id]
    );

    if (!story) {
      throw new AppError(404, 'Story not found');
    }

    const result = await query<StoryPage>(
      'SELECT * FROM story_pages WHERE story_id = $1 ORDER BY page_number',
      [storyId]
    );

    res.json({ pages: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/generate-story/:storyId/illustration-status
router.get('/:storyId/illustration-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyId } = req.params;

    // Verify story access
    const story = await queryOne<Story>(
      `SELECT s.* FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE s.id = $1 AND cp.user_id = $2`,
      [storyId, req.user!.id]
    );

    if (!story) {
      throw new AppError(404, 'Story not found');
    }

    const result = await query<StoryPage>(
      'SELECT page_number, illustration_status FROM story_pages WHERE story_id = $1 ORDER BY page_number',
      [storyId]
    );

    const pages = result.rows;
    const completed = pages.filter((p) => p.illustration_status === 'completed').length;
    const failed = pages.filter((p) => p.illustration_status === 'failed').length;

    res.json({
      total_pages: pages.length,
      completed,
      failed,
      pages: pages.map((p) => ({
        page_number: p.page_number,
        status: p.illustration_status,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/generate-story/:storyId/regenerate-illustrations
router.post('/:storyId/regenerate-illustrations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storyId } = req.params;

    // Verify story access
    const story = await queryOne<Story>(
      `SELECT s.*, cp.id as child_profile_id FROM stories s
       JOIN child_profiles cp ON s.child_profile_id = cp.id
       WHERE s.id = $1 AND cp.user_id = $2`,
      [storyId, req.user!.id]
    );

    if (!story) {
      throw new AppError(404, 'Story not found');
    }

    // Reset failed illustrations to pending
    await query(
      `UPDATE story_pages SET illustration_status = 'pending' WHERE story_id = $1 AND illustration_status = 'failed'`,
      [storyId]
    );

    // Start regenerating illustrations
    generatePageIllustrations(storyId, story.child_profile_id).catch((error) => {
      console.error('Background illustration regeneration failed:', error);
    });

    res.json({ message: 'Illustration regeneration started' });
  } catch (error) {
    next(error);
  }
});

interface StoryGenerationParams {
  childName: string;
  childAge: number;
  theme?: string;
  characters?: string[];
  mood?: string;
  values?: string[];
  pageCount: number;
  wordsPerPage: number;
  familyMembers: FamilyMember[];
  interests: string[];
}

interface PageContent {
  content: string;
  illustrationPrompt: string;
}

async function generateStoryWithPages(params: StoryGenerationParams): Promise<{
  title: string;
  fullContent: string;
  pages: PageContent[];
  wordCount: number;
}> {
  const {
    childName,
    childAge,
    theme,
    characters,
    mood,
    values,
    pageCount,
    wordsPerPage,
    familyMembers,
    interests,
  } = params;

  const totalWords = pageCount * wordsPerPage;

  const systemPrompt = `You are a children's story writer creating personalized, age-appropriate stories formatted as picture book pages.
Write engaging stories with clear narratives, positive messages, and vivid descriptions.
Each page should have a natural pause point, like a picture book would.
Use age-appropriate vocabulary for a ${childAge}-year-old.
Never include scary, violent, or inappropriate content.`;

  let userPrompt = `Write a children's story for a ${childAge}-year-old child named ${childName}.
The story should have exactly ${pageCount} pages, with about ${wordsPerPage} words per page (total ~${totalWords} words).

Each page should:
- End at a natural pause point (like a cliffhanger or scene change)
- Be suitable for having its own illustration
- Be 2-4 sentences long`;

  if (theme) userPrompt += `\nTheme: ${theme}`;
  if (mood) userPrompt += `\nMood: ${mood}`;
  if (characters && characters.length > 0) userPrompt += `\nCharacters: ${characters.join(', ')}`;
  if (values && values.length > 0) userPrompt += `\nValues to incorporate: ${values.join(', ')}`;
  if (interests.length > 0) userPrompt += `\nThe child is interested in: ${interests.join(', ')}`;
  if (familyMembers.length > 0) {
    userPrompt += `\nInclude these family members: ${familyMembers.map(m => `${m.name} (${m.relationship})`).join(', ')}`;
  }

  userPrompt += `

Format your response EXACTLY as:
TITLE: [Story Title]

PAGE 1:
[Page 1 content - 2-4 sentences ending at a natural pause]
ILLUSTRATION: [Brief description of what illustration should show for this page]

PAGE 2:
[Page 2 content]
ILLUSTRATION: [Description]

... continue for all ${pageCount} pages`;

  try {
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
        max_tokens: 4000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${await response.text()}`);
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const text = data.choices[0]?.message?.content || '';

    // Parse title
    const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|PAGE)/i);
    const title = titleMatch?.[1]?.trim() || 'A Special Story';

    // Parse pages
    const pages: PageContent[] = [];
    const pageRegex = /PAGE\s*(\d+):\s*([\s\S]*?)(?=PAGE\s*\d+:|$)/gi;
    let match;

    while ((match = pageRegex.exec(text)) !== null) {
      const pageContent = match[2].trim();

      // Extract illustration prompt
      const illustrationMatch = pageContent.match(/ILLUSTRATION:\s*(.+?)$/im);
      const illustrationPrompt = illustrationMatch?.[1]?.trim() || '';

      // Get content without illustration line
      const content = pageContent.replace(/ILLUSTRATION:\s*.+$/im, '').trim();

      if (content) {
        pages.push({
          content,
          illustrationPrompt: illustrationPrompt || `Scene from page ${pages.length + 1}: ${content.substring(0, 100)}`,
        });
      }
    }

    // Fallback if parsing failed
    if (pages.length === 0) {
      // Split content into pages manually
      const storyMatch = text.match(/STORY:\s*([\s\S]+)$/i) || text.match(/PAGE\s*1:\s*([\s\S]+)$/i);
      const content = storyMatch?.[1]?.trim() || text;
      const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
      const sentencesPerPage = Math.ceil(sentences.length / pageCount);

      for (let i = 0; i < pageCount; i++) {
        const pageContent = sentences.slice(i * sentencesPerPage, (i + 1) * sentencesPerPage).join(' ').trim();
        if (pageContent) {
          pages.push({
            content: pageContent,
            illustrationPrompt: `Scene: ${pageContent.substring(0, 100)}`,
          });
        }
      }
    }

    // Combine all pages for full content
    const fullContent = pages.map(p => p.content).join('\n\n');
    const wordCount = fullContent.split(/\s+/).length;

    return { title, fullContent, pages, wordCount };
  } catch (error) {
    console.error('Error generating story:', error);
    throw new AppError(500, 'Failed to generate story');
  }
}

async function generateIllustration(
  prompt: string,
  theme: string | undefined,
  mood: string | undefined,
  childProfileId: string,
  type: 'cover' | 'page' = 'page'
): Promise<string | null> {
  const fullPrompt = `A children's book illustration: ${prompt}
Style: Colorful, friendly, whimsical, suitable for children, picture book style.
${theme ? `Theme: ${theme}.` : ''}
${mood ? `Mood: ${mood}.` : ''}
No text in the image. Warm and inviting atmosphere.
${type === 'cover' ? 'This is a cover illustration, make it eye-catching and magical.' : ''}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${await response.text()}`);
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };

    // Extract base64 image from response
    const imageContent = data.choices[0]?.message?.content;
    if (!imageContent) return null;

    // If it's a base64 image, save it
    const base64Match = imageContent.match(/data:image\/(\w+);base64,(.+)/);
    if (base64Match) {
      const [, format, base64Data] = base64Match;
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const storyDir = path.join(uploadDir, 'story-illustrations', childProfileId);

      await fs.mkdir(storyDir, { recursive: true });

      const filename = `${Date.now()}-${type}.${format}`;
      const filepath = path.join(storyDir, filename);

      await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'));

      return `/uploads/story-illustrations/${childProfileId}/${filename}`;
    }

    return null;
  } catch (error) {
    console.error('Error generating illustration:', error);
    return null;
  }
}

async function generatePageIllustrations(storyId: string, childProfileId: string): Promise<void> {
  // Get story info
  const story = await queryOne<Story>(
    'SELECT theme, mood FROM stories WHERE id = $1',
    [storyId]
  );

  if (!story) return;

  // Get all pending pages
  const result = await query<StoryPage>(
    `SELECT * FROM story_pages WHERE story_id = $1 AND illustration_status = 'pending' ORDER BY page_number`,
    [storyId]
  );

  const pages = result.rows;

  // Generate illustrations sequentially to avoid rate limits
  for (const page of pages) {
    try {
      // Mark as generating
      await query(
        `UPDATE story_pages SET illustration_status = 'generating' WHERE id = $1`,
        [page.id]
      );

      const illustrationUrl = await generateIllustration(
        page.illustration_prompt || `Page ${page.page_number} scene`,
        story.theme ?? undefined,
        story.mood ?? undefined,
        childProfileId,
        'page'
      );

      if (illustrationUrl) {
        await query(
          `UPDATE story_pages SET illustration_url = $1, illustration_status = 'completed' WHERE id = $2`,
          [illustrationUrl, page.id]
        );
      } else {
        await query(
          `UPDATE story_pages SET illustration_status = 'failed' WHERE id = $1`,
          [page.id]
        );
      }
    } catch (error) {
      console.error(`Failed to generate illustration for page ${page.page_number}:`, error);
      await query(
        `UPDATE story_pages SET illustration_status = 'failed' WHERE id = $1`,
        [page.id]
      );
    }

    // Small delay between generations to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export default router;
