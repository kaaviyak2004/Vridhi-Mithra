# 🌱 Vridhi Mitra – AI-Powered Student Performance & Personalized Learning System

A comprehensive AI-driven platform that streamlines academic management, tracks real-time performance, and provides personalized learning guidance using the Google Gemini AI engine.

## ✨ Key Features

### 🏢 Super Admin
- 🏛️ **College Management** – Multi-tenancy support to manage multiple institutions.
- 🛡️ **Role Control** – Oversee Admins, Faculty, and Student populations.
- 📊 **Global Analytics** – System-wide performance and enrollment statistics.

### 🛡️ Admin
- 👥 **User Lifecycle** – Manage account activation, verification, and roles.
- 📚 **Academic Setup** – Create courses, assign faculty, and manage enrollments.
- 🎨 **Platform Theming** – Unified "Deep Royal Purple" design system.

### 👨‍🏫 Faculty
- 🤖 **AI Quiz Generator** – Automated quiz creation for **any subject** using Google Gemini.
- 📂 **Digital Content Material (DCM)** – Upload and manage study resources (PDFs, Videos, Links).
- 📝 **Standardized Marks Entry** – Dedicated support for **FIAT**, **SIAT**, and **Model Exams**.
- 📅 **Smart Attendance** – Real-time attendance tracking with status reports.
- 👁️ **Weak Student Identification** – Data-driven insights to provide extra support.

### 🎓 Student
- 🤖 **Pragati AI Bot** – Intelligent learning assistant for concept clearing and study plans.
- 🎯 **AI Learning Paths** – Personalized roadmap generated based on individual performance.
- 📊 **Dynamic Dashboard** – Glassmorphic UI with real-time progress charts.
- 🎤 **AI Mock Interviews** – Placement preparation with real-time AI feedback and grading.
- 📝 **Automated Assessments** – Take AI-generated quizzes and get instant results.
- 💬 **Discussion Forums** – Collaborative peer learning community.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Recharts, Zustand, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8 + Sequelize ORM (Multi-tenant ready) |
| **AI Engine** | Google Gemini Flash 1.5 |
| **Auth** | JWT + OTP Email Verification (Nodemailer) |
| **Styling** | Custom "Unified Deep Royal Purple" CSS System |

## 🚀 Quick Start

### 1. Setup Database
```sql
CREATE DATABASE vridhi_mitra;
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
# Add your MySQL password, Nodemailer (Gmail), and GEMINI_API_KEY
npm install
```

### 3. Seed Demo Data
```bash
cd backend
node scripts/seedData.js       # Core data
node scripts/seedQuestions.js  # Automated question bank
```

### 4. Run Application
```bash
# Terminal 1 (Backend)
cd backend && node server.js

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | superadmin@vridhimitra.com | password123 |
| **Admin** | admin@vridhimitra.com | password123 |
| **Faculty** | priya@vridhimitra.com | password123 |
| **Student** | aarav@student.com | password123 |

---

Built with ❤️ by the Vridhi Mitra Team for Hackathon St. Joseph 🚀
