import pool from '../utils/db.js';
import { Trie } from '../utils/trie.js';

// 1. Get statistics: total skills, mentors, students
export async function getStatistics(req, res) {
  try {
    const [skills, mentors, students] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM skills'),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'mentor'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'")
    ]);
    res.json({
      totalSkills: parseInt(skills.rows[0].count),
      totalMentors: parseInt(mentors.rows[0].count),
      totalStudents: parseInt(students.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 2. Search users (by name/email, case-insensitive, trie suggestion)
export async function searchUsers(req, res) {
  const { q } = req.query;
  if (!q) return res.json({ suggestions: [] });
  try {
    // Fetch all users for trie (could optimize with caching)
    const usersRes = await pool.query('SELECT id, name, email, role FROM users');
    const trie = new Trie();
    usersRes.rows.forEach(u => {
      trie.insert(u.name, { id: u.id, name: u.name, email: u.email, role: u.role });
      trie.insert(u.email, { id: u.id, name: u.name, email: u.email, role: u.role });
    });
    const suggestions = trie.startsWith(q, 10);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 3. Get user details (by id, role-based)
export async function getUserDetails(req, res) {
  const { id } = req.params;
  try {
    const userRes = await pool.query('SELECT id, name, email, role, location FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];
    // Get skills
    const skillsRes = await pool.query(
      'SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1',
      [id]
    );
    user.skills = skillsRes.rows.map(r => r.name);
    if (user.role === 'student') {
      // Get mentor name(s)
      const mentorRes = await pool.query(
        `SELECT u.name FROM mentor_students ms JOIN users u ON ms.mentor_id = u.id WHERE ms.student_id = $1 LIMIT 1`,
        [id]
      );
      user.mentor = mentorRes.rows.length ? mentorRes.rows[0].name : null;
      return res.json(user);
    } else if (user.role === 'mentor') {
      // Get mentee names (paginated)
      const limit = parseInt(req.query.limit) || 5;
      const offset = parseInt(req.query.offset) || 0;
      const menteeRes = await pool.query(
        `SELECT u.name FROM mentor_students ms JOIN users u ON ms.student_id = u.id WHERE ms.mentor_id = $1 LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );
      user.mentees = menteeRes.rows.map(r => r.name);
      // Get announcements (paginated)
      const annLimit = parseInt(req.query.annLimit) || 5;
      const annOffset = parseInt(req.query.annOffset) || 0;
      const annRes = await pool.query(
        `SELECT id, content, created_at FROM announcements WHERE mentor_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [id, annLimit, annOffset]
      );
      user.announcements = annRes.rows;
      return res.json(user);
    } else {
      return res.json(user);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 4. Delete announcements older than a date
export async function deleteOldAnnouncements(req, res) {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date required' });
  try {
    await pool.query('DELETE FROM announcements WHERE created_at < $1', [date]);
    res.json({ message: 'Old announcements deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
