import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, FamilyRelationship } from '../types/index.js';

const router = Router();

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
      birth_date,
      notes,
      is_alive = true,
      photo_url,
      occupation,
      hobbies,
      fun_facts,
      connection_description,
      photo_description,
      generation_level,
      position_x,
      position_y,
    } = req.body;

    const id = uuidv4();
    const result = await queryOne<FamilyMember>(
      `INSERT INTO family_members (
        id, user_id, name, relationship, birth_date, notes, is_alive,
        photo_url, occupation, hobbies, fun_facts, connection_description,
        photo_description, generation_level, position_x, position_y
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        id, req.user!.id, name, relationship, birth_date, notes, is_alive,
        photo_url, occupation, hobbies, fun_facts, connection_description,
        photo_description, generation_level, position_x, position_y,
      ]
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
      name, relationship, birth_date, notes, is_alive, photo_url,
      occupation, hobbies, fun_facts, connection_description,
      photo_description, generation_level, position_x, position_y,
    } = req.body;

    const result = await queryOne<FamilyMember>(
      `UPDATE family_members SET
        name = COALESCE($1, name),
        relationship = COALESCE($2, relationship),
        birth_date = COALESCE($3, birth_date),
        notes = COALESCE($4, notes),
        is_alive = COALESCE($5, is_alive),
        photo_url = COALESCE($6, photo_url),
        occupation = COALESCE($7, occupation),
        hobbies = COALESCE($8, hobbies),
        fun_facts = COALESCE($9, fun_facts),
        connection_description = COALESCE($10, connection_description),
        photo_description = COALESCE($11, photo_description),
        generation_level = COALESCE($12, generation_level),
        position_x = COALESCE($13, position_x),
        position_y = COALESCE($14, position_y),
        updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        name, relationship, birth_date, notes, is_alive, photo_url,
        occupation, hobbies, fun_facts, connection_description,
        photo_description, generation_level, position_x, position_y,
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

export default router;
