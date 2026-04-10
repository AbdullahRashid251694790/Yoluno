import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToChild } from '../socket/index.js';
import type { Server } from 'socket.io';
import type { FamilyMember, FamilyRelationship } from '../types/index.js';

const router = Router();

// Helper: notify all children of a parent about family updates
async function notifyKidsAboutFamily(
  req: Request,
  userId: string,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const children = await query<{ id: string }>(
      'SELECT id FROM child_profiles WHERE user_id = $1',
      [userId]
    );
    const io = req.app.get('io') as Server | undefined;

    for (const child of children.rows) {
      const notification = await queryOne<{ id: string; child_profile_id: string; notification_type: string; title: string; message: string; is_read: boolean; created_at: string; metadata: Record<string, unknown> }>(
        `INSERT INTO kid_notifications (child_profile_id, notification_type, title, message, metadata)
         VALUES ($1, 'family_update', $2, $3, $4)
         RETURNING *`,
        [child.id, title, message, JSON.stringify(metadata)]
      );

      if (io && notification) {
        emitToChild(io, child.id, 'kid-notification', notification);
      }
    }
  } catch (error) {
    console.error('Failed to send family notification to kids:', error);
  }
}

router.use(requireAuth);

// GET /api/family/members
router.get('/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<FamilyMember>(
      `SELECT * FROM family_members
       WHERE user_id = $1
       ORDER BY generation_level NULLS LAST, created_at`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/family/members/:id
router.get('/members/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await queryOne<FamilyMember>(
      'SELECT * FROM family_members WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!member) {
      throw new AppError(404, 'Family member not found');
    }

    res.json(member);
  } catch (error) {
    next(error);
  }
});

// POST /api/family/members
router.post('/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      relationship,
      relationship_type, // Accept both names for compatibility
      birth_date,
      notes,
      is_alive = true,
      photo_url,
      video_url,
      occupation,
      hobbies,
      fun_facts,
      connection_description,
      photo_description,
      generation_level,
      position_x,
      position_y,
      side = 'direct',
      specific_relationship,
      parent_member_id,
    } = req.body;

    // Use relationship_type if relationship is not provided
    const relationshipValue = relationship || relationship_type;

    // Prevent duplicate members (same user + name)
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM family_members WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [req.user!.id, name]
    );
    if (existing) {
      throw new AppError(409, 'A family member with this name already exists');
    }

    // Ensure hobbies is a proper array for PostgreSQL
    const hobbiesArray = Array.isArray(hobbies) ? hobbies : (hobbies ? [hobbies] : []);

    const id = uuidv4();
    const result = await queryOne<FamilyMember>(
      `INSERT INTO family_members (
        id, user_id, name, relationship, birth_date, notes, is_alive,
        photo_url, video_url, occupation, hobbies, fun_facts, connection_description,
        photo_description, generation_level, position_x, position_y,
        side, specific_relationship, parent_member_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        id, req.user!.id, name, relationshipValue, birth_date || null, notes || null, is_alive,
        photo_url || null, video_url || null, occupation || null, hobbiesArray, fun_facts || null,
        connection_description || null, photo_description || null, generation_level || null,
        position_x || null, position_y || null, side, specific_relationship || null, parent_member_id || null,
      ]
    );

    // Notify kids about new family member
    await notifyKidsAboutFamily(
      req, req.user!.id,
      'New family member!',
      `${name} has joined your family tree! Tap to meet them.`,
      { memberId: id }
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/family/members/:id
router.put('/members/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await queryOne<FamilyMember>(
      'SELECT id FROM family_members WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!existing) {
      throw new AppError(404, 'Family member not found');
    }

    const {
      name, relationship, relationship_type, birth_date, notes, is_alive, photo_url,
      video_url, occupation, hobbies, fun_facts, connection_description,
      photo_description, generation_level, position_x, position_y,
      side, specific_relationship, parent_member_id,
    } = req.body;

    // Use relationship_type if relationship is not provided
    const relationshipValue = relationship || relationship_type;

    // Ensure hobbies is a proper array for PostgreSQL if provided
    const hobbiesArray = hobbies !== undefined
      ? (Array.isArray(hobbies) ? hobbies : (hobbies ? [hobbies] : []))
      : undefined;

    const result = await queryOne<FamilyMember>(
      `UPDATE family_members SET
        name = COALESCE($1, name),
        relationship = COALESCE($2, relationship),
        birth_date = COALESCE($3, birth_date),
        notes = COALESCE($4, notes),
        is_alive = COALESCE($5, is_alive),
        photo_url = COALESCE($6, photo_url),
        video_url = COALESCE($7, video_url),
        occupation = COALESCE($8, occupation),
        hobbies = COALESCE($9::text[], hobbies),
        fun_facts = COALESCE($10, fun_facts),
        connection_description = COALESCE($11, connection_description),
        photo_description = COALESCE($12, photo_description),
        generation_level = COALESCE($13, generation_level),
        position_x = COALESCE($14, position_x),
        position_y = COALESCE($15, position_y),
        side = COALESCE($16, side),
        specific_relationship = COALESCE($17, specific_relationship),
        parent_member_id = COALESCE($18, parent_member_id),
        updated_at = NOW()
       WHERE id = $19
       RETURNING *`,
      [
        name, relationshipValue, birth_date, notes, is_alive, photo_url,
        video_url, occupation, hobbiesArray, fun_facts, connection_description,
        photo_description, generation_level, position_x, position_y,
        side, specific_relationship, parent_member_id,
        req.params.id,
      ]
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/family/members/:id
router.delete('/members/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'DELETE FROM family_members WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Family member not found');
    }

    res.json({ message: 'Family member deleted' });
  } catch (error) {
    next(error);
  }
});

// GET /api/family/relationships
router.get('/relationships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<FamilyRelationship>(
      'SELECT * FROM family_relationships WHERE user_id = $1',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/family/relationships
router.post('/relationships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { member1_id, member2_id, relationship_type } = req.body;

    // Verify both members belong to user
    const members = await query<FamilyMember>(
      'SELECT id FROM family_members WHERE id IN ($1, $2) AND user_id = $3',
      [member1_id, member2_id, req.user!.id]
    );

    if (members.rowCount !== 2) {
      throw new AppError(400, 'Invalid family members');
    }

    const id = uuidv4();
    const result = await queryOne<FamilyRelationship>(
      `INSERT INTO family_relationships (id, user_id, member1_id, member2_id, relationship_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, req.user!.id, member1_id, member2_id, relationship_type]
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/family/relationships/:id
router.delete('/relationships/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'DELETE FROM family_relationships WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Relationship not found');
    }

    res.json({ message: 'Relationship deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/family/extract-from-description
// Extracts structured family member data from a voice transcription using AI
router.post('/extract-from-description', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transcription } = req.body;

    if (!transcription || typeof transcription !== 'string') {
      throw new AppError(400, 'Transcription text is required');
    }

    const systemPrompt = `You are a helpful assistant that extracts structured family member information from natural language descriptions. Extract the information and return ONLY valid JSON (no markdown, no explanation).

The JSON should have these fields:
- name: string (the person's full name)
- relationship: string (one of: parent, grandparent, sibling, aunt_uncle, cousin, other)
- specificRelationship: string (one of: father, mother, paternal_grandfather, paternal_grandmother, maternal_grandfather, maternal_grandmother, brother, sister, paternal_uncle, paternal_aunt, maternal_uncle, maternal_aunt, cousin, step_parent, step_sibling, other)
- side: string (one of: "paternal" if from father's side, "maternal" if from mother's side, "direct" if parent/sibling/child)
- occupation: string or null (their job/profession)
- hobbies: array of strings (their hobbies/interests)
- funFacts: string or null (interesting facts about them)
- connectionDescription: string or null (how they relate to the child, e.g., "Dad's sister", "Mom's father")
- isLiving: boolean (true if alive, false if deceased - default to true if not mentioned)

If a field is not mentioned, use null for strings or empty array for hobbies.`;

    const userPrompt = `Extract family member information from this description:\n\n"${transcription}"`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', await response.text());
      throw new AppError(500, 'Failed to extract family member data');
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    let extracted;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extracted = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new AppError(500, 'Failed to parse extracted data');
    }

    res.json({
      name: extracted.name || '',
      relationship: extracted.relationship || 'other',
      specificRelationship: extracted.specificRelationship || null,
      side: extracted.side || 'direct',
      occupation: extracted.occupation || null,
      hobbies: Array.isArray(extracted.hobbies) ? extracted.hobbies : [],
      funFacts: extracted.funFacts || null,
      connectionDescription: extracted.connectionDescription || null,
      isLiving: extracted.isLiving !== false,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Multiple Videos & Stories per Family Member ─────────────────────────────

// GET /api/family/members/:id/videos
router.get('/members/:id/videos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{ id: string; video_url: string; title: string | null; created_at: string }>(
      'SELECT * FROM family_member_videos WHERE family_member_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/family/members/:id/videos
router.post('/members/:id/videos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { video_url, title } = req.body;
    if (!video_url) throw new AppError(400, 'Video URL is required');

    const result = await queryOne(
      `INSERT INTO family_member_videos (id, family_member_id, video_url, title)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [uuidv4(), req.params.id, video_url, title || null]
    );

    // Notify kids only if member is not brand new (skip during initial creation)
    const member = await queryOne<{ name: string; user_id: string; created_at: string }>('SELECT name, user_id, created_at FROM family_members WHERE id = $1', [req.params.id]);
    if (member && Date.now() - new Date(member.created_at).getTime() > 60000) {
      await notifyKidsAboutFamily(req, member.user_id, 'New video!', `${member.name} has a new video for you!`, { memberId: req.params.id });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/family/members/:memberId/videos/:videoId
router.delete('/members/:memberId/videos/:videoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM family_member_videos WHERE id = $1 AND family_member_id = $2', [req.params.videoId, req.params.memberId]);
    res.json({ message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
});

// GET /api/family/members/:id/stories
router.get('/members/:id/stories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{ id: string; content: string; created_at: string }>(
      'SELECT * FROM family_member_stories WHERE family_member_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/family/members/:id/stories
router.post('/members/:id/stories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content) throw new AppError(400, 'Content is required');

    const result = await queryOne(
      `INSERT INTO family_member_stories (id, family_member_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [uuidv4(), req.params.id, content]
    );

    // Notify kids only if member is not brand new (skip during initial creation)
    const member = await queryOne<{ name: string; user_id: string; created_at: string }>('SELECT name, user_id, created_at FROM family_members WHERE id = $1', [req.params.id]);
    if (member && Date.now() - new Date(member.created_at).getTime() > 60000) {
      await notifyKidsAboutFamily(req, member.user_id, 'New story!', `There's a new story about ${member.name}!`, { memberId: req.params.id });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/family/members/:memberId/stories/:storyId
router.delete('/members/:memberId/stories/:storyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM family_member_stories WHERE id = $1 AND family_member_id = $2', [req.params.storyId, req.params.memberId]);
    res.json({ message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
});

// ─── Multiple Photos per Family Member ────────────────────────────────────────

// GET /api/family/members/:id/photos
router.get('/members/:id/photos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{ id: string; photo_url: string; caption: string | null; created_at: string }>(
      'SELECT * FROM family_member_photos WHERE family_member_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/family/members/:id/photos
router.post('/members/:id/photos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { photo_url, caption } = req.body;
    if (!photo_url) throw new AppError(400, 'Photo URL is required');

    const result = await queryOne(
      `INSERT INTO family_member_photos (id, family_member_id, photo_url, caption)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [uuidv4(), req.params.id, photo_url, caption || null]
    );

    // Notify kids only if member is not brand new (skip during initial creation)
    const member = await queryOne<{ name: string; user_id: string; created_at: string }>('SELECT name, user_id, created_at FROM family_members WHERE id = $1', [req.params.id]);
    if (member && Date.now() - new Date(member.created_at).getTime() > 60000) {
      await notifyKidsAboutFamily(req, member.user_id, 'New photo!', `${member.name} has a new photo to see!`, { memberId: req.params.id });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/family/members/:memberId/photos/:photoId
router.delete('/members/:memberId/photos/:photoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM family_member_photos WHERE id = $1 AND family_member_id = $2', [req.params.photoId, req.params.memberId]);
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
