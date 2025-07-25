import express from 'express';
import pool from '../utils/db.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Mentor creates announcement for a skill group
// Mentor creates announcement for a skill group by skill name
router.post('/announcement', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Forbidden' });
  const { skillName, content } = req.body;
  if (!skillName || !content) return res.status(400).json({ error: 'Missing fields' });
  try {
    // Try to find the skill by name
    const skillRes = await pool.query('SELECT id FROM skills WHERE LOWER(name) = LOWER($1)', [skillName]);
    if (skillRes.rows.length === 0) {
      // Suggest similar skills
      const suggestRes = await pool.query('SELECT name FROM skills WHERE name ILIKE $1 LIMIT 3', [`%${skillName}%`]);
      const suggestions = suggestRes.rows.map(r => r.name);
      return res.status(404).json({ error: 'Skill not found', suggestions });
    }
    const skillId = skillRes.rows[0].id;
    await pool.query(
      'INSERT INTO announcements (mentor_id, skill_id, content) VALUES ($1, $2, $3)',
      [req.user.id, skillId, content]
    );
    res.json({ message: 'Announcement sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get announcements for a student (by their skills)
router.get('/announcements', authenticateJWT, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'student') {
      rows = await pool.query(
        `SELECT a.*, s.name as skill, u.name as mentor_name
         FROM announcements a
         JOIN skills s ON a.skill_id = s.id
         JOIN users u ON a.mentor_id = u.id
         WHERE a.skill_id IN (
           SELECT skill_id FROM user_skills WHERE user_id = $1
         )
         ORDER BY a.created_at DESC`,
        [req.user.id]
      );
    } else if (req.user.role === 'mentor') {
      rows = await pool.query(
        `SELECT a.*, s.name as skill
         FROM announcements a
         JOIN skills s ON a.skill_id = s.id
         WHERE a.mentor_id = $1
         ORDER BY a.created_at DESC`,
        [req.user.id]
      );
    } else {
      rows = await pool.query(
        `SELECT a.*, s.name as skill, u.name as mentor_name
         FROM announcements a
         JOIN skills s ON a.skill_id = s.id
         JOIN users u ON a.mentor_id = u.id
         ORDER BY a.created_at DESC`
      );
    }
    res.json(rows.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
