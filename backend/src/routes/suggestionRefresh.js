// Add a route to refresh the tries manually (optional, for admin or dev use)
import express from 'express';
import { buildSuggestionTries } from '../utils/suggestion.js';

const router = express.Router();

router.post('/refresh', async (req, res) => {
  await buildSuggestionTries();
  res.json({ message: 'Suggestion tries refreshed' });
});

export default router;
