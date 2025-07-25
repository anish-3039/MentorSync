import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';

// Only allow admin users
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
}
import {
  getStatistics,
  searchUsers,
  getUserDetails,
  deleteOldAnnouncements
} from '../controllers/adminController.js';

const router = express.Router();


// All admin endpoints require both JWT and admin role
router.get('/statistics', authenticateJWT, authorizeAdmin, getStatistics);
router.get('/search', authenticateJWT, authorizeAdmin, searchUsers);
router.get('/user/:id', authenticateJWT, authorizeAdmin, getUserDetails);
router.delete('/announcements', authenticateJWT, authorizeAdmin, deleteOldAnnouncements);

export default router;
