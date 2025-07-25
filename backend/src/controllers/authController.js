import pool from '../utils/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

// Helper: Find mentor by skill, location, and threshold
async function findAvailableMentor(skillId, location, threshold = 5) {
  // Find mentors with the same skill and location (village)
  const mentors = await pool.query(
    `SELECT u.id, u.name, COUNT(ms.student_id) as student_count
     FROM users u
     JOIN user_skills us ON u.id = us.user_id
     LEFT JOIN mentor_students ms ON u.id = ms.mentor_id AND ms.skill_id = $1
     WHERE u.role = 'mentor' AND us.skill_id = $1 AND u.location->>'village' = $2
     GROUP BY u.id
     HAVING COUNT(ms.student_id) < $3
     ORDER BY student_count ASC
     LIMIT 1`,
    [skillId, location.village, threshold]
  );
  return mentors.rows[0];
}

export async function register(req, res) {
  const { name, email, password, role, location, skills } = req.body;
  if (!name || !email || !password || !role || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashed = await hashPassword(password);
    const userRes = await pool.query(
      `INSERT INTO users (name, email, password, role, location) VALUES ($1, $2, $3, $4, $5) RETURNING id` ,
      [name, email, hashed, role, location]
    );
    const userId = userRes.rows[0].id;
    // Add skills
    if (skills && skills.length) {
      for (const skillName of skills) {
        let skill = await pool.query('SELECT id FROM skills WHERE name = $1', [skillName]);
        let skillId;
        if (skill.rows.length === 0) {
          const newSkill = await pool.query('INSERT INTO skills (name) VALUES ($1) RETURNING id', [skillName]);
          skillId = newSkill.rows[0].id;
        } else {
          skillId = skill.rows[0].id;
        }
        await pool.query('INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)', [userId, skillId]);
        // If student, assign mentor
        if (role === 'student') {
          const mentor = await findAvailableMentor(skillId, location);
          if (mentor) {
            await pool.query('INSERT INTO mentor_students (mentor_id, student_id, skill_id) VALUES ($1, $2, $3)', [mentor.id, userId, skillId]);
          }
        }
      }
    }
    const token = generateToken({ id: userId, role });
    res.status(201).json({ token, userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
    if (userRes.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = userRes.rows[0];
    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken({ id: user.id, role: user.role });
    res.json({ token, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
