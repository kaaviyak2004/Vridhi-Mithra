# 🌱 Vridhi Mitra – AI-Based Student Performance & Personalized Learning System

A full-stack AI-powered web application that tracks academic performance and actively guides students on what to learn next using AI.

## ✨ Features

### Student
- 📊 Smart Dashboard with performance analytics (charts, graphs)
- 🤖 **Pragati Bot** – AI assistant for study help, concept explanation, and study plans
- 🎯 AI-generated personalized learning paths
- 📝 Performance tracking (marks, grades, attendance)
- 💬 Discussion forums for peer learning
- 🏆 Gamification (badges & achievements)
- 🔔 Notifications & reminders

### Faculty
- 👨‍🏫 View student dashboards and analytics
- 📋 Create assessments and enter marks (bulk)
- 📅 Record attendance
- 👁️ Identify weak students

### Admin
- 🛡️ User management (activate/deactivate)
- 📚 Course management and faculty assignment
- 📊 System-wide statistics
- 👥 Enrollment management

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Recharts, Zustand, React Router |
| Backend | Node.js, Express.js |
| Database | MySQL 8 + Sequelize ORM |
| AI | Google Gemini API (with mock fallback) |
| Auth | JWT + OTP (Nodemailer) |
| Styling | Custom CSS (glassmorphism, dark theme) |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MySQL 8.0

### 1. Setup Database
```sql
CREATE DATABASE vridhi_mitra;
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL password, Gmail credentials, and Gemini API key
npm install
```

### 3. Seed Demo Data
```bash
cd backend
node scripts/seedData.js
```

### 4. Start Backend
```bash
cd backend
node server.js
# → http://localhost:5000
```

### 5. Start Frontend
```bash
cd frontend
npm install
npx vite
# → http://localhost:5173
```

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vridhimitra.com | password123 |
| Faculty | priya@vridhimitra.com | password123 |
| Student | aarav@student.com | password123 |
| Student (strong) | diya@student.com | password123 |
| Student (weak) | vivaan@student.com | password123 |

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/       # JWT auth, file upload
│   ├── models/          # 11 Sequelize models
│   ├── routes/          # API routes (auth, student, faculty, admin, ai, discussion)
│   ├── scripts/         # Database seeder
│   ├── utils/           # AI integration, email service
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── components/  # Sidebar navigation
        ├── pages/       # All application pages
        ├── store/       # Zustand auth store
        └── utils/       # Axios API client
```

## 🗄️ Database Schema

11 tables with proper foreign key relationships:
- `users` – All users (student, faculty, admin)
- `courses` – Course catalog
- `enrollments` – Student-course links
- `assessments` – Quizzes, assignments, exams
- `performance` – Student marks/grades
- `attendance` – Daily attendance records
- `learning_paths` – AI-generated study plans
- `chat_messages` – Pragati Bot conversations
- `notifications` – System alerts
- `achievements` – Badges & milestones
- `discussion_posts` / `discussion_replies` – Forum

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` – Register with OTP
- `POST /api/auth/verify-otp` – Verify email
- `POST /api/auth/login` – JWT login

### Student
- `GET /api/student/dashboard` – Aggregated stats
- `GET /api/student/performance` – Marks history
- `GET /api/student/attendance` – Attendance records
- `GET /api/student/learning-paths` – AI study plans

### AI
- `POST /api/ai/chat` – Pragati Bot conversation
- `POST /api/ai/analyze` – Performance analysis
- `POST /api/ai/quiz` – Quiz generation

### Faculty
- `GET /api/faculty/dashboard` – Faculty overview
- `POST /api/faculty/assessments` – Create test
- `POST /api/faculty/marks` – Bulk marks entry

### Admin
- `GET /api/admin/dashboard` – System stats
- `GET/PUT/DELETE /api/admin/users` – User management
- `POST /api/admin/courses` – Course management

---

Built with ❤️ for hackathon by Vridhi Mitra Team
