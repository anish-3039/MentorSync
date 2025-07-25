// Express router for authentication and admin features
const express = require('express');
const {
  register,
  login,
  searchUsers,
  getUserDetails,
  getMentorAnnouncements,
  getMentorMentees,
  getTotalMentors,
  getTotalMentees
} = require('../controllers/authController');

const router = express.Router();

// Auth routes
// Register route for user signup
router.post('/register', register);
// Login route
router.post('/login', login);

// Admin routes
// Search users by name/email
router.get('/admin/search', searchUsers); // ?query=searchText
// Get user details
router.get('/admin/user/:userId', getUserDetails);
// Get all announcements by a mentor
router.get('/admin/mentor/:mentorId/announcements', getMentorAnnouncements);
// Get all mentees of a mentor
router.get('/admin/mentor/:mentorId/mentees', getMentorMentees);
// Get total mentors
router.get('/admin/totalMentors', getTotalMentors);
// Get total mentees
router.get('/admin/totalMentees', getTotalMentees);

module.exports = router;
