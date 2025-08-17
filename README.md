# MentorSync

A full-stack student-mentor platform featuring role-based dashboards, skill-based mentor-student matching, real-time and paginated announcements, fast user search with trie-based auto-complete, and an admin panel for platform stats, user management, and bulk operations—all secured with JWT authentication and built using **React**, **Node.js/Express**, and **PostgreSQL**.

---

## Workflow

### User Authentication
- User registers or logs in.
- On signup, user provides details (role, skills, location).
- Backend creates user, assigns mentor if student, returns JWT.
- On login, backend verifies credentials and returns JWT + user info.
- All API requests are authenticated via JWT.
- Role-based access is enforced on the backend.

### Dashboard Routing
- After login, frontend routes the user to their respective dashboard:
  - **Student Dashboard**: View profile, assigned mentor, and announcements filtered by skills.
  - **Mentor Dashboard**: View profile, list of students, create/edit announcements.
  - **Admin Dashboard**: Access platform stats, search users (with trie-based auto-complete), bulk delete announcements.

### Mentor Assignment
- When a student signs up, backend matches a mentor with the same skill and village.
- If found, a `mentor_students` record is created.
- If not, returns error.

### Announcements
- Mentors can create, edit, delete announcements for their skills.
- Students see announcements relevant to their skills.
- Announcements are paginated and filterable.
- Real-time updates are reflected in the UI.


### Profile & Data Fetching
- Each dashboard fetches profile and related data (students, announcements, queries) via API.
- Data is persisted in **PostgreSQL**.

---

## Project Structure

### Frontend (React)
- Handles all user interaction and UI.
- `Auth.js`: Login/Signup forms, calls backend.
- `Dashboard.js`: Routes to `StudentDashboard`, `MentorDashboard`, or `AdminDashboard` based on role.
- Each dashboard fetches and displays relevant data.

### Backend (Node.js + Express)
- Provides REST API for all operations.
- Auth endpoints for login/signup using JWT.
- Mentor assignment logic (skill + village).
- CRUD endpoints for announcements.
- Role-based access control for routes.

### Database (PostgreSQL)
- **users**: All user info, including role and location (JSON).
- **user_skills**: Skills for each user.
- **mentor_students**: Mentor-student assignment mapping.
- **skills**: List of all skills.
- **announcements**: Announcements created by mentors.

---

## Key Flows

1. **Signup**
   - User registers → backend creates user → if student, mentor assigned → JWT returned.

2. **Login**
   - User logs in → backend verifies credentials → JWT + user info returned.

3. **Dashboard**
   - Frontend fetches profile and related data via API.
   - Displays role-based dashboard and management tools.

4. **Mentor Assignment**
   - Students matched to mentors by skill + village.

5. **Announcements/Queries**
   - Managed via CRUD APIs.
   - Visible only to relevant users.

---
