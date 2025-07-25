import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import announcementRoutes from './routes/announcement.js';
import skillsRoutes from './routes/skills.js';
import suggestionRoutes from './routes/suggestion.js';
import suggestionRefreshRoutes from './routes/suggestionRefresh.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Log all requests for easier debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);

import adminRoutes from './routes/admin.js';
app.use('/api/skills', skillsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', announcementRoutes);
app.use('/api/suggest', suggestionRoutes);
app.use('/api/suggest', suggestionRefreshRoutes); // POST /api/suggest/refresh
app.use('/api/admin', adminRoutes); // Admin dashboard endpoints

// Catch 404 and send JSON error
app.use((req, res, next) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler for better error messages
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.get('/', (req, res) => {
  res.send('Student-Mentor Platform API');
});

import { buildSuggestionTries } from './utils/suggestion.js';
const PORT = process.env.PORT || 5000;
// Build tries at server start
buildSuggestionTries().then(() => {
  console.log('Suggestion tries built');
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
