# TaskFlow — Team Task Manager

Full-stack task management app with role-based access (Admin/Member).

## Stack
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React + Vite + React Router
- **Auth**: JWT
- **Deploy**: Railway

---

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## Deploy to Railway

### Step 1 — MongoDB
1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → create a free cluster
2. Create a database user and grab the connection string

### Step 2 — Deploy Backend
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the repo, set **Root Directory** to `backend`
4. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=some_long_random_string
   FRONTEND_URL=https://your-frontend.up.railway.app
   NODE_ENV=production
   ```
5. Deploy. Copy the generated URL (e.g. `https://taskflow-backend.up.railway.app`)

### Step 3 — Deploy Frontend
1. In Railway, add a new service → Deploy from same GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
4. Deploy. Your app is live!

---

## Features

### Authentication
- Signup / Login with JWT
- First user to sign up becomes **Admin** automatically
- Token stored in localStorage, auto-attached to all requests

### Role-Based Access
| Feature | Admin | Member |
|---------|-------|--------|
| View all projects | ✅ | ❌ (own/member only) |
| Create projects | ✅ | ✅ |
| Delete any project | ✅ | ❌ (own only) |
| Manage users | ✅ | ❌ |
| Change user roles | ✅ | ❌ |

### Projects
- Create, view, edit, delete projects
- Add members by email
- Status: Active / On Hold / Completed

### Tasks
- Create tasks within a project
- Assign to project members
- Status: Todo / In Progress / Done (inline quick-update)
- Priority: Low / Medium / High
- Due dates with overdue indicator (⚠)
- Filter by status and priority

### Dashboard
- Stats: total projects, tasks, in-progress, done, overdue
- Recent tasks table across all accessible projects

---

## API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users               (admin only)
PATCH  /api/users/:id/role      (admin only)

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members

GET    /api/projects/:id/tasks
POST   /api/projects/:id/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id

GET    /api/dashboard
GET    /health
```
