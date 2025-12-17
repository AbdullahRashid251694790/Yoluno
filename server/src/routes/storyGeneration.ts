import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Story, ChildProfile, FamilyMember } from '../types/index.js';

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

    // Determine word count based on age and length
    const wordCounts: Record<string, number> = {
      short: child.age < 6 ? 150 : 250,
      medium: child.age < 6 ? 300 : 500,
      long: child.age < 6 ? 500 : 800,
    };
    const targetWordCount = wordCounts[storyLength] || wordCounts.medium;

    // Generate story text
    const storyContent = await generateStoryText({
      childName: child.name,
      childAge: child.age,
      theme,
      characters,
      mood,
      values,
      targetWordCount,
      familyMembers,
      interests: child.interests || [],
    });

    // Generate illustration
    let illustrationUrl: string | null = null;
    try {
      illustrationUrl = await generateIllustration(storyContent.title, theme, mood, child_profile_id);
    } catch (error) {
      console.error('Failed to generate illustration:', error);
      // Continue without illustration
    }

    // Save story to database
    const storyId = uuidv4();
    const story = await queryOne<Story>(
      `INSERT INTO stories (
        id, child_profile_id, title, content, theme, mood,
        values, word_count, illustration_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        storyId,
        child_profile_id,
        storyContent.title,
        storyContent.content,
        theme,
        mood,
        values,
        storyContent.wordCount,
        illustrationUrl,
      ]
    );

    res.status(201).json({
      story,
      warning: illustrationUrl ? null : 'Illustration generation failed',
    });
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
  targetWordCount: number;
  familyMembers: FamilyMember[];
  interests: string[];
}

async function generateStoryText(params: StoryGenerationParams): Promise<{
  title: string;
  content: string;
  wordCount: number;
}> {
  const {
    childName,
    childAge,
    theme,
    characters,
    mood,
    values,
    targetWordCount,
    familyMembers,
    interests,
  } = params;

  const systemPrompt = `You are a children's story writer creating personalized, age-appropriate stories.
Write engaging stories with clear narratives, positive messages, and vivid descriptions.
Always include a beginning, middle, and end.
Use age-appropriate vocabulary for a ${childAge}-year-old.
Never include scary, violent, or inappropriate content.`;

  let userPrompt = `Write a ${targetWordCount}-word story for a ${childAge}-year-old child named ${childName}.`;

  if (theme) userPrompt += `\nTheme: ${theme}`;
  if (mood) userPrompt += `\nMood: ${mood}`;
  if (characters && characters.length > 0) userPrompt += `\nCharacters: ${characters.join(', ')}`;
  if (values && values.length > 0) userPrompt += `\nValues to incorporate: ${values.join(', ')}`;
  if (interests.length > 0) userPrompt += `\nThe child is interested in: ${interests.join(', ')}`;
  if (familyMembers.length > 0) {
    userPrompt += `\nInclude these family members: ${familyMembers.map(m => `${m.name} (${m.relationship})`).join(', ')}`;
  }

  userPrompt += `\n\nFormat your response as:
TITLE: [Story Title]
STORY:
[Story content]`;

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
        max_tokens: 2000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${await response.text()}`);
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const text = data.choices[0]?.message?.content || '';

    // Parse title and content
    const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|STORY:)/i);
    const storyMatch = text.match(/STORY:\s*([\s\S]+)$/i);

    const title = titleMatch?.[1]?.trim() || 'A Special Story';
    const content = storyMatch?.[1]?.trim() || text;
    const wordCount = content.split(/\s+/).length;

    return { title, content, wordCount };
  } catch (error) {
    console.error('Error generating story:', error);
    throw new AppError(500, 'Failed to generate story');
  }
}

async function generateIllustration(
  title: string,
  theme: string | undefined,
  mood: string | undefined,
  childProfileId: string
): Promise<string | null> {
  const prompt = `A children's book illustration for a story titled "${title}".
Style: Colorful, friendly, suitable for children.
${theme ? `Theme: ${theme}.` : ''}
${mood ? `Mood: ${mood}.` : ''}
No text in the image. Warm and inviting atmosphere.`;

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
            content: prompt,
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

      const filename = `${Date.now()}.${format}`;
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

export default router;
