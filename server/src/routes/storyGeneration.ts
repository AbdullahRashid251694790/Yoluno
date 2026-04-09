import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadFile, getFileUrl } from '../utils/storage.js';
import { emitToChild } from '../socket/index.js';
import type { Server } from 'socket.io';
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
      created_by = 'parent',
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
      childGender: child.gender,
      theme,
      characters,
      mood,
      values,
      pageCount: config.pages,
      wordsPerPage: config.wordsPerPage,
      familyMembers,
      interests: child.interests || [],
    });

    // Save story to database (cover image generated in background)
    const storyId = uuidv4();
    const story = await queryOne<Story>(
      `INSERT INTO stories (
        id, child_profile_id, title, content, theme, mood,
        values, word_count, cover_image_url, has_pages, narrator_voice, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        null,
        true,
        narratorVoice,
        created_by,
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

    // Generate cover + page illustrations in the background
    const io = req.app.get('io') as Server | undefined;
    generateAllIllustrations(storyId, child_profile_id, storyContent.title, theme, mood, io).catch((error) => {
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
      warning: null,
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

    // Resolve illustration URLs (signed S3 URLs in production)
    const pages = await Promise.all(
      result.rows.map(async (page) => {
        if (page.illustration_url && !page.illustration_url.startsWith('http')) {
          const url = await getFileUrl(page.illustration_url, 3600);
          return { ...page, illustration_url: url };
        }
        return page;
      })
    );

    res.json({ pages });
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
    const io = req.app.get('io') as Server | undefined;
    generateAllIllustrations(storyId, story.child_profile_id, story.title, story.theme ?? undefined, story.mood ?? undefined, io).catch((error) => {
      console.error('Background illustration regeneration failed:', error);
    });

    res.json({ message: 'Illustration regeneration started' });
  } catch (error) {
    next(error);
  }
});

interface StoryCharacter {
  name: string;
  gender?: 'boy' | 'girl';
}

interface StoryGenerationParams {
  childName: string;
  childAge: number;
  childGender?: 'boy' | 'girl' | 'prefer_not_to_say';
  theme?: string;
  characters?: StoryCharacter[];
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
    childGender,
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

  // Build pronoun guidance for the main character (the child)
  let pronounGuidance = '';
  if (childGender === 'boy') {
    pronounGuidance = `Use he/him pronouns for ${childName}.`;
  } else if (childGender === 'girl') {
    pronounGuidance = `Use she/her pronouns for ${childName}.`;
  }

  const systemPrompt = `You are a children's story writer creating personalized, age-appropriate stories formatted as picture book pages.
Write engaging stories with clear narratives, positive messages, and vivid descriptions.
Each page should have a natural pause point, like a picture book would.
Use age-appropriate vocabulary for a ${childAge}-year-old.
Never include scary, violent, or inappropriate content.
${pronounGuidance}

IMPORTANT: Every story MUST have a completely unique and creative title. Never reuse titles like "The Whispering Woods" or "The Enchanted Forest". Be inventive — use the child's name, the theme, and unexpected word combinations to create a one-of-a-kind title. Examples of creative titles: "The Day ${childName} Found a Cloud", "${childName}'s Secret Rainbow Machine", "The Tiny Dragon Who Loved Pancakes".`;

  let userPrompt = `Write a children's story for a ${childAge}-year-old child named ${childName}.
The story should have exactly ${pageCount} pages, with about ${wordsPerPage} words per page (total ~${totalWords} words).

Each page should:
- End at a natural pause point (like a cliffhanger or scene change)
- Be suitable for having its own illustration
- Be 2-4 sentences long`;

  if (theme) userPrompt += `\nTheme: ${theme}`;
  if (mood) userPrompt += `\nMood: ${mood}`;
  if (characters && characters.length > 0) {
    const characterDescriptions = characters.map(char => {
      if (char.gender === 'boy') return `${char.name} (he/him)`;
      if (char.gender === 'girl') return `${char.name} (she/her)`;
      return char.name;
    });
    userPrompt += `\nCharacters: ${characterDescriptions.join(', ')}`;
  }
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
        temperature: 0.95,
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
  const fullPrompt = `Children's book illustration: ${prompt}
Style: Colorful, friendly, whimsical, picture book style, digital art.
${theme ? `Theme: ${theme}.` : ''}
${mood ? `Mood: ${mood}.` : ''}
No text or words in the image. Warm and inviting atmosphere.
${type === 'cover' ? 'Cover illustration — eye-catching and magical.' : ''}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-image-preview',
        messages: [
          { role: 'user', content: fullPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation failed:', errorText);
      return null;
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: {
          content?: string;
          images?: Array<{ type: string; image_url: { url: string } }>;
        };
      }>;
    };

    // Extract base64 image from response images array
    const images = data.choices?.[0]?.message?.images;
    if (!images || images.length === 0) {
      console.error('No images in response:', JSON.stringify(data.choices?.[0]?.message).substring(0, 500));
      return null;
    }

    const imageUrl = images[0].image_url?.url;
    if (!imageUrl) {
      console.error('No image URL in response');
      return null;
    }

    // Parse base64 from data URL (data:image/png;base64,...)
    const match = imageUrl.match(/data:image\/([\w+]+);base64,(.+)/);
    if (!match) {
      console.error('Could not parse base64 from image URL');
      return null;
    }

    const imageFormat = match[1].replace('+', '');
    const base64Data = match[2];

    // Upload via storage service (S3 in production, local in dev)
    const ext = imageFormat === 'jpeg' ? 'jpg' : imageFormat;
    const filename = `${Date.now()}-${type}.${ext}`;
    const key = `story-illustrations/${childProfileId}/${filename}`;
    const buffer = Buffer.from(base64Data, 'base64');

    await uploadFile(key, buffer, `image/${imageFormat}`);

    return key;
  } catch (error) {
    console.error('Error generating illustration:', error);
    return null;
  }
}

async function generateAllIllustrations(
  storyId: string,
  childProfileId: string,
  title: string,
  theme: string | undefined,
  mood: string | undefined,
  io?: Server
): Promise<void> {
  // Generate cover image first
  try {
    const coverUrl = await generateIllustration(
      `Cover image for "${title}"`,
      theme,
      mood,
      childProfileId,
      'cover'
    );
    if (coverUrl) {
      await query(
        `UPDATE stories SET cover_image_url = $1 WHERE id = $2`,
        [coverUrl, storyId]
      );
    }
  } catch (error) {
    console.error('Failed to generate cover illustration:', error);
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Get all pending pages
  const result = await query<StoryPage>(
    `SELECT * FROM story_pages WHERE story_id = $1 AND illustration_status = 'pending' ORDER BY page_number`,
    [storyId]
  );

  const pages = result.rows;

  // Generate page illustrations sequentially with retry
  for (const page of pages) {
    try {
      await query(
        `UPDATE story_pages SET illustration_status = 'generating' WHERE id = $1`,
        [page.id]
      );

      let illustrationUrl: string | null = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        illustrationUrl = await generateIllustration(
          page.illustration_prompt || `Page ${page.page_number} scene`,
          theme,
          mood,
          childProfileId,
          'page'
        );
        if (illustrationUrl) break;
        if (attempt < maxRetries) {
          console.log(`Retrying illustration for page ${page.page_number} (attempt ${attempt + 2})`);
          await new Promise((resolve) => setTimeout(resolve, 15000));
        }
      }

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

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Check if all illustrations completed — send kid notification
  try {
    const statusResult = await queryOne<{ total: string; completed: string }>(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE illustration_status = 'completed') as completed
       FROM story_pages WHERE story_id = $1`,
      [storyId]
    );

    const total = parseInt(statusResult?.total || '0');
    const completed = parseInt(statusResult?.completed || '0');

    if (total > 0 && completed === total) {
      // All illustrations done — create kid notification
      const notification = await queryOne<{ id: string; child_profile_id: string; notification_type: string; title: string; message: string; is_read: boolean; created_at: string; metadata: Record<string, unknown> }>(
        `INSERT INTO kid_notifications (child_profile_id, notification_type, title, message, metadata)
         VALUES ($1, 'story_complete', $2, $3, $4)
         RETURNING *`,
        [
          childProfileId,
          'Your story is ready!',
          `"${title}" is complete with all its pictures! Tap to read it now.`,
          JSON.stringify({ storyId }),
        ]
      );

      // Emit real-time notification to kid
      if (io && notification) {
        emitToChild(io, childProfileId, 'kid-notification', notification);
      }
    }
  } catch (error) {
    console.error('Failed to send story completion notification:', error);
  }
}

export default router;
