

import express from 'express';
import pool from '../utils/db.js';
import { authenticateJWT } from '../middleware/auth.js';
const router = express.Router();

// Get student profile (name, created_at, skills, mentor)
router.get('/student/profile', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    const userRes = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    const skillsRes = await pool.query('SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [req.user.id]);
    user.skills = skillsRes.rows.map(r => r.name);
    // Get mentor for first skill (if any)
    let mentor = null;
    if (user.skills.length) {
      const mentorRes = await pool.query(
        `SELECT u.name FROM mentor_students ms JOIN users u ON ms.mentor_id = u.id WHERE ms.student_id = $1 LIMIT 1`,
        [req.user.id]
      );
      mentor = mentorRes.rows.length ? mentorRes.rows[0].name : null;
    }
    user.mentor = mentor;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get mentor profile (name, created_at, skills, students)
router.get('/mentor/profile', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Forbidden' });
  try {
    const userRes = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    const skillsRes = await pool.query('SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [req.user.id]);
    user.skills = skillsRes.rows.map(r => r.name);
    // Get students
    const studentsRes = await pool.query(
      `SELECT u.id, u.name FROM mentor_students ms JOIN users u ON ms.student_id = u.id WHERE ms.mentor_id = $1`,
      [req.user.id]
    );
    user.students = studentsRes.rows;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get announcements for student (by skill, paginated)
router.get('/student/announcements', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  const { offset = 0, limit = 5 } = req.query;
  try {
    const annRes = await pool.query(
      `SELECT a.id, a.content, a.created_at, s.name as skill, u.name as mentor_name
       FROM announcements a
       JOIN skills s ON a.skill_id = s.id
       JOIN users u ON a.mentor_id = u.id
       WHERE a.skill_id IN (SELECT skill_id FROM user_skills WHERE user_id = $1)
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(annRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get announcements for mentor (by skill, paginated, filterable)
router.get('/mentor/announcements', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Forbidden' });
  const { skill, offset = 0, limit = 5 } = req.query;
  try {
    let annRes;
    if (skill) {
      annRes = await pool.query(
        `SELECT a.id, a.content, a.created_at, s.name as skill
         FROM announcements a
         JOIN skills s ON a.skill_id = s.id
         WHERE a.mentor_id = $1 AND s.name = $2
         ORDER BY a.created_at DESC
         LIMIT $3 OFFSET $4`,
        [req.user.id, skill, limit, offset]
      );
    } else {
      annRes = await pool.query(
        `SELECT a.id, a.content, a.created_at, s.name as skill
         FROM announcements a
         JOIN skills s ON a.skill_id = s.id
         WHERE a.mentor_id = $1
         ORDER BY a.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );
    }
    res.json(annRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mentor edit announcement
router.put('/mentor/announcement/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    // Only allow editing own announcements
    const check = await pool.query('SELECT id FROM announcements WHERE id = $1 AND mentor_id = $2', [id, req.user.id]);
    if (!check.rows.length) return res.status(403).json({ error: 'Not allowed' });
    await pool.query('UPDATE announcements SET content = $1 WHERE id = $2', [content, id]);
    res.json({ message: 'Announcement updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// Get students assigned to a mentor
router.get('/mentor/students', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ error: 'Forbidden' });
  try {
    const students = await pool.query(
      `SELECT u.id, u.name, u.email, u.location, s.name as skill
       FROM mentor_students ms
       JOIN users u ON ms.student_id = u.id
       JOIN skills s ON ms.skill_id = s.id
       WHERE ms.mentor_id = $1`,
      [req.user.id]
    );
    res.json(students.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get mentors assigned to a student
router.get('/student/mentors', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    const mentors = await pool.query(
      `SELECT u.id, u.name, u.email, u.location, s.name as skill
       FROM mentor_students ms
       JOIN users u ON ms.mentor_id = u.id
       JOIN skills s ON ms.skill_id = s.id
       WHERE ms.student_id = $1`,
      [req.user.id]
    );
    res.json(mentors.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group members (students with same mentor and skill)
router.get('/group/:skillId', authenticateJWT, async (req, res) => {
  const { skillId } = req.params;
  try {
    const group = await pool.query(
      `SELECT u.id, u.name, u.email, u.location
       FROM mentor_students ms
       JOIN users u ON ms.student_id = u.id
       WHERE ms.mentor_id = $1 AND ms.skill_id = $2`,
      [req.user.id, skillId]
    );
    res.json(group.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
