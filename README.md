## Skill Assessment Reporting Portal 🧠📊

A full-stack platform for creating skill quizzes, tracking attempts, and surfacing performance & skill-gap insights.

**Stack:** Node.js + Express + Prisma (client-only) + MySQL + JWT + RBAC • React + React Router + Webpack • Redis caching • Docker Compose (MySQL + Redis + Backend + Frontend) • Jest + Supertest

## ✨ Demo & Features

**User**
- 🧾 Register / Login (JWT)
- 📝 Take a quiz by skill
- 📈 View past attempts & scores

**Admin**
- 🧰 Manage questions (Add / Edit / Replace options / Delete)
- 📊 View user reports (table + basic chart)
- 🔐 Role-based access control (`admin`, `user`)

**System**
- 🔒 Secure API endpoints (JWT + RBAC middleware)
- 🔎 Pagination & filtering on list endpoints
- ⚡️ Redis caching for heavy report queries

> **Schema Approach:** MySQL schema is created from a SQL file; **Prisma is used as a client only** (no Prisma migrations). This keeps DB ownership in SQL while enjoying Prisma’s type-safe queries.

---

## 🏛 Architecture

```mermaid
flowchart LR
  subgraph Client [Frontend (React + Webpack)]
    A[Login/Register] --> B[Dashboard]
    B --> C[Admin: Questions & Reports]
  end

  subgraph Backend [Node.js + Express]
    D[Auth & RBAC]
    E[Skills/Questions/Attempts]
    F[Reports]
    G[Prisma Client]
  end

  subgraph Cache [Redis]
    H[(Cache)]
  end

  subgraph DB [MySQL]
    I[(skill_portal)]
  end

  Client <-- JWT --> Backend
  Backend <--> Cache
  Backend <--> DB
  ```

## 🗂 Project Structure
```mermaid
skill-portal/
├─ backend/
│  ├─ src/                      # Express app, controllers, routes, middleware
│  ├─ prisma/
│  │  └─ schema.prisma          # Prisma schema mapped to existing DB tables
│  ├─ db/
│  │  └─ skill-portal-schema.sql# MySQL schema + optional seed
│  ├─ package.json
│  └─ Dockerfile
├─ frontend/
│  ├─ public/                   # index.html
│  ├─ src/                      # React app (JS), Router, pages, components
│  ├─ webpack.config.js
│  ├─ .babelrc
│  ├─ package.json
│  └─ Dockerfile
└─ docker-compose.yml
```

## 🚀 Quick Start (Docker)
One command to bring up MySQL + Redis + Backend + Frontend:
```
docker compose up -d --build
```
Open:

Frontend: http://localhost:3000

Backend API: http://localhost:4000

### Default admin (ensured on boot if enabled in compose):

Email: admin@example.com

Password: Admin@123

### Reset volumes (if you change the DB init SQL and want it to re-run):
```bash 
docker compose down -v
docker compose up -d --build
```

## 📘 API Documentation

**Base URL:** `http://localhost:4000/api`  
**Auth:** Bearer token → `Authorization: Bearer <JWT>`

---

### 🔑 Auth
- **POST** `/auth/register`  
  **Body:**  
  `{ "fullName": "User One", "email": "user1@example.com", "password": "User@123" }`  

  **Response:**  
  `{ "token": "...", "user": { "id": "1", "email": "user1@example.com", "role": "user", "fullName": "User One" } }`

- **POST** `/auth/login`  
  **Body:**  
  `{ "email": "admin@example.com", "password": "Admin@123" }`  

  **Response:** same shape as register.

- **GET** `/auth/me`  
  Returns the current authenticated user.

---

### 👤 Users (Admin Only)
- **GET** `/users?page=1&limit=10&search=foo`  
- **GET** `/users/:id`  
- **POST** `/users`  
  **Body:**  
  `{ "fullName": "U2", "email": "u2@example.com", "password": "User@123", "role": "user" }`

- **PATCH** `/users/:id`  
  **Body (any subset):**  
  `{ "fullName": "New Name", "role": "admin", "isActive": true }`

- **DELETE** `/users/:id`

---

### 🏷 Skills
- **GET** `/skills?page=1&limit=20&search=js`  
- **POST** `/skills` *(admin only)*  
  `{ "name": "JavaScript", "description": "Core JS" }`

- **PATCH** `/skills/:id`  
  `{ "description": "Updated", "isActive": true }`

- **DELETE** `/skills/:id` *(admin only)*

---

### ❓ Questions
- **GET** `/questions?skillId=1&page=1&limit=50`  
- **POST** `/questions` *(admin only)*  
```
{
"skillId": 1,
"questionText": "Which clause filters rows?",
"difficulty": "easy",
"explanation": "WHERE filters rows.",
"options": [
{ "position": 1, "optionText": "GROUP BY", "isCorrect": false },
{ "position": 2, "optionText": "WHERE", "isCorrect": true },
{ "position": 3, "optionText": "ORDER BY", "isCorrect": false }
]
}
```

- **PATCH** `/questions/:id`  
`{ "questionText": "Updated question?" }`

- **PUT** `/questions/:id/options` *(replace all options)*  
```
{
"options": [
{ "position": 1, "optionText": "HAVING", "isCorrect": false },
{ "position": 2, "optionText": "WHERE", "isCorrect": true }
]
}
```

- **DELETE** `/questions/:id`

✅ **Validation Rules**  
- Exactly **one option** must be `isCorrect: true`  
- `position` values must be **unique per question**

---

### 📝 Quiz Attempts
- **POST** `/attempts/start`  
`{ "skillId": 1 }`

- **POST** `/attempts/:attemptId/answer`  
`{ "questionId": 10, "selectedOptionId": 22, "timeSpentSeconds": 5 }`

- **POST** `/attempts/:attemptId/submit`  
Calculates results (`correctAnswers`, `scorePercent`), sets status to `submitted`, and timestamps.

- **GET** `/attempts?status=submitted&page=1&limit=10`  
- Users see their **own attempts**  
- Admins may filter by user: `/attempts?userId=123&status=submitted`

---

### 📊 Reports
- **GET** `/reports/user-performance?userId=123`  
→ Per-skill aggregates: attempts, avg score, totals.

- **GET** `/reports/skill-gap?userId=123`  
→ Average score per skill (ascending) for quick gap identification.

- **GET** `/reports/time?period=week&userId=123&skillId=1`  
→ Attempts in the last 7 days (or 30 for month) + summary.

---

### 📦 Common Response Shape
- **Lists:**  
`{ "data": [ ... ], "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }`

- **Single entity:**  
`{ "data": { ... } }`

- **Errors:**  
`{ "message": "Something went wrong" }`

---

### ⚡ Caching (Redis)
Report endpoints use **Redis** to cache results:  
- **User performance:** 60s  
- **Skill gap:** 60s  
- **Time-based:** 30s  

**Cache keys:**  
- `userPerformance:<userId>`  
- `skillGap:<userId>`  
- `time:<period>:<userId>:<skillId|ALL>`  

If Redis is unavailable → graceful fallback (no cache).

---

### 🧪 Testing (Jest + Supertest)
Integration tests cover:  
- Auth (register / login / me)  
- RBAC (401 / 403)  
- Users CRUD (admin)  
- Skills CRUD  
- Questions CRUD (+ validation rules)  
- Attempts flow *(start → answer → submit → list)*  
- Reports *(with a cache hit)*  

**Run tests:**  
```bash
cd ./backend
npm test
```

💡 Recommended: use a separate test DB (e.g., `skill_portal_test`) via `DATABASE_URL` in test environment to avoid wiping dev data.

## 💡 Frontend Notes

- **Framework:** React + React Router *(no TypeScript)*  
- **Dev Server:** [http://localhost:3000](http://localhost:3000)  

---

### 🔧 API Base Configuration
- Defined in **`frontend/.env`** as `API_BASE`  
- **Webpack DefinePlugin** sets `__API_BASE__`  
- **`src/config.js`** reads from `__API_BASE__` or `window.__API_BASE__`

---

### 🧭 User Flows
- **Authentication:** Login / Register  
- **Dashboard (User):**  
  - Choose skill → start quiz  
  - View table of past attempts  
- **Admin Panel:**  
  - Manage questions  
  - View reports (table + simple SVG bar chart)


## 🗃 Database Schema

The system uses a **relational database** with the following tables:

---

### **Users**
- `id`  
- `user_uuid`  
- `full_name`  
- `email` *(unique)*  
- `password_hash`  
- `role` *(admin / user)*  
- `is_active`  
- `last_login_at`  
- `timestamps`

---

### **Skills**
- `id`  
- `name` *(unique)*  
- `description`  
- `is_active`  
- `timestamps`

---

### **Questions**
- `id`  
- `skill_id` → **skills.id**  
- `question_text`  
- `difficulty` *(easy / medium / hard)*  
- `explanation`  
- `is_active`  
- `timestamps`

---

### **Question Options**
- `id`  
- `question_id` → **questions.id**  
- `position`  
- `option_text`  
- `is_correct`  
- `timestamps`  

🔑 **Unique Constraint:** *(question_id, position)*

---

### **Quiz Attempts**
- `id`  
- `user_id` → **users.id**  
- `skill_id` → **skills.id**  
- `total_questions`  
- `correct_answers`  
- `score_percent(5,2)`  
- `status` *(in_progress / submitted / scored)*  
- `started_at`  
- `submitted_at`  
- `duration_seconds`  
- `timestamps`

---

### **Quiz Answers**
- `id`  
- `attempt_id` → **quiz_attempts.id**  
- `question_id` → **questions.id**  
- `selected_option_id` → **question_options.id**  
- `is_correct`  
- `time_spent_seconds`  
- `answered_at`  

🔑 **Unique Constraint:** *(attempt_id, question_id)*

---

📌 **Note:**  
The schema is created by **`backend/db/skill-portal-schema.sql`**.  
Prisma maps to these existing tables for **client-only usage**.
