import express from 'express';
import pool from '../utils/db.js';

const router = express.Router();

// Get all skills (for dropdowns, etc.)
router.get('/skills', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM skills ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
