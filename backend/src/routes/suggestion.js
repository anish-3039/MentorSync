import express from 'express';
import { suggestSkills, suggestUsers } from '../utils/suggestion.js';

const router = express.Router();

// GET /api/suggest/skills?query=abc
router.get('/skills', (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 1) return res.json([]);
  res.json(suggestSkills(query));
});

// GET /api/suggest/users?query=abc
router.get('/users', (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 1) return res.json([]);
  res.json(suggestUsers(query));
});

export default router;
