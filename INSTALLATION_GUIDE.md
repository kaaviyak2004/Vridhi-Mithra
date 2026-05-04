# 🌱 Vridhi Mitra – Installation & Setup Guide

This guide will walk you through the steps to get the **Vridhi Mitra** platform running on your local machine.

---

## 📋 Prerequisites
Ensure the following are installed on your system:
*   **Node.js** (v20 or higher)
*   **MySQL Server** (v8.0)
*   **Git**

---

## 🚀 Step-by-Step Installation

### 1. Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/kaaviyak2004/Vridhi-Mithra.git
cd Vridhi-Mithra
```

### 2. Backend Setup
1.  **Navigate to backend:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    *   Rename `.env.example` to `.env`.
    *   Open `.env` and enter your MySQL details and Gemini API Key:
        ```text
        DB_PASSWORD=your_mysql_password
        GEMINI_API_KEY=your_google_gemini_key
        EMAIL_USER=your_gmail@gmail.com
        EMAIL_PASS=your_gmail_app_password
        ```
4.  **Create Database:**
    *   Run in MySQL: `CREATE DATABASE vridhi_mitra;`
5.  **Seed Demo Data:**
    *   Populate the platform with initial records:
        ```bash
        node scripts/seedData.js
        node scripts/seedQuestions.js
        ```
6.  **Start Backend:**
    ```bash
    node server.js
    ```

### 3. Frontend Setup
1.  **Open a new terminal** and navigate to the frontend:
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start Frontend:**
    ```bash
    npm run dev
    ```

---

## 🔐 Demo Login Credentials
*Note: All passwords are `password123`. The system automatically generates 5 sample colleges upon seeding.*

| Role | Email Example | College |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@vridhimitra.com` | *Global (All Colleges)* |
| **Admin** | `admin@rmk.com` | RMK Engineering College |
| **Faculty** | `faculty@rural.com` | Rural Tech Institute |
| **Student** | `student1@village.com` | Village Academy |
| **Faculty** | `faculty@modern.com` | Modern Polytechnic |
| **Admin** | `admin@greenwood.com` | Greenwood Science College |

### 💡 Login Email Pattern
You can log in to any college using this simple pattern:
*   **Admins:** `admin@[college_first_name].com`
*   **Faculty:** `faculty@[college_first_name].com`
*   **Students:** `student1@[college_first_name].com`

---

## 🏛️ Managing Multiple Institutions
Since Vridhi Mitra is a multi-tenant platform for rural education:

1.  **Global View:** Log in as **Super Admin** to oversee all 5 colleges and manage regional educational networks.
2.  **College View:** Log in as an **Admin** of a specific college (e.g., `admin@rmk.com`) to manage local enrollments and faculty.
3.  **Localized Learning:** Faculty and Students only see data related to their specific institution, ensuring data privacy and a focused learning environment.


---

Built with ❤️ by the Vridhi Mitra Team for Hackathon St. Joseph 🚀

