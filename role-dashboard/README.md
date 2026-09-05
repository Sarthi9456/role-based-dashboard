# Role-Based Dashboard

A basic role-based dashboard built for the developer assessment task. It implements authentication,
three user roles (Admin / Manager / Employee), role-based authorization enforced on the backend,
and full CRUD for Users, Projects, and Tasks.

**Stack:** Node.js, Express, Sequelize ORM, SQLite (zero external DB server needed), EJS + Bootstrap 5,
express-session for auth, bcryptjs for password hashing.

> Note on stack choice: the task brief uses "migrations and seeders", which map directly onto
> Sequelize CLI here (`npx sequelize-cli db:migrate` / `db:seed:all`) — the same concepts as
> Laravel's migrations/seeders, just in the Node ecosystem. Swapping the dialect in
> `config/config.js` (e.g. to `mysql` or `postgres`) works with no other code changes.

---

## 1. Requirements

- Node.js 18+ and npm

No separate database server is required — SQLite stores everything in a single `database.sqlite`
file created by the migrations.

## 2. Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# (edit SESSION_SECRET if you like; defaults work out of the box)

# 3. Run migrations (creates all tables)
npm run db:migrate

# 4. Seed demo data (roles, users, projects, tasks)
npm run db:seed

# 5. Start the server
npm start
# or, for auto-reload during development:
npm run dev
```

The app runs at **http://localhost:3000**.

To wipe and rebuild the database from scratch at any point:

```bash
npm run db:fresh
```

## 3. Demo Login Credentials

All seeded accounts share the same password (from `SEED_DEFAULT_PASSWORD` in `.env`,
default `Password@123`):

| Role     | Email                  | Password       |
|----------|-------------------------|----------------|
| Admin    | admin@example.com       | Password@123   |
| Manager  | manager@example.com     | Password@123   |
| Employee | employee1@example.com   | Password@123   |
| Employee | employee2@example.com   | Password@123   |
| Employee | employee3@example.com   | Password@123   |

## 4. Project Structure

```
config/          Sequelize DB configuration (SQLite by default)
migrations/      Sequelize CLI migrations (Roles, Users, Projects, Tasks, ProjectEmployees)
seeders/         Sequelize CLI seeders (demo roles/users/projects/tasks)
models/          Sequelize models + associations
middleware/
  auth.js        requireAuth - session gate for every protected route
  rbac.js        authorize(...roles) - server-side role check per route
controllers/     Route handlers (auth, dashboard, users, projects, tasks)
routes/          Express routers, wired to controllers + middleware
views/           EJS templates (Bootstrap 5 UI)
public/          Static assets (CSS)
app.js           App entry point
```

## 5. Authentication & Authorization

- Sessions are created on login (`express-session`) and destroyed on logout; passwords are
  hashed with bcrypt and never stored or returned in plain text.
- **Every** protected route re-checks `req.session.user` on the server (`requireAuth`), and
  role-restricted routes additionally run `authorize('Admin', 'Manager', ...)`. This means
  typing a restricted URL directly (e.g. an Employee navigating to `/users/1/edit`) is blocked
  at the route level regardless of what links are shown in the UI — the sidebar only *hides*
  links a role can't use, it isn't what enforces the restriction.
- The `/api/*` JSON endpoints reuse the exact same `requireAuth` / `authorize` middleware.

### Role / Permission Matrix

| Action                                   | Admin | Manager | Employee |
|-------------------------------------------|:---:|:---:|:---:|
| View dashboard statistics                  | ✅ (global) | ✅ (global) | ✅ (own only) |
| View users list                             | ✅ (all) | ✅ (employees only, read-only) | ❌ |
| Create / edit / delete users, assign roles  | ✅ | ❌ | ❌ |
| View projects                               | ✅ (all) | ✅ (all) | ✅ (assigned only) |
| Create / edit projects, assign employees    | ✅ | ✅ | ❌ |
| Delete projects                             | ✅ | ❌ | ❌ |
| Update project status                       | ✅ | ✅ | ❌ |
| View tasks                                  | ✅ (all) | ✅ (all) | ✅ (assigned only) |
| Create / edit tasks, assign to employees     | ✅ | ✅ | ❌ |
| Delete tasks                                | ✅ | ❌ | ❌ |
| Update task status                          | ✅ (any) | ✅ (any) | ✅ (own tasks only) |

## 6. Database Schema & Relationships

- **Role** 1 — N **User** (`User.roleId`)
- **User** 1 — N **Project** (`Project.createdBy`, who created it)
- **User** 1 — N **Task** (`Task.assignedTo`, who it's assigned to)
- **Project** 1 — N **Task** (`Task.projectId`)
- **Project** N — N **User** through **ProjectEmployee** (assigned employees per project)

Users, Projects, and Tasks use Sequelize's `paranoid: true` (soft delete) — deleting a record
sets `deletedAt` instead of removing the row, satisfying the "Soft Delete" bonus item.

## 7. Bonus Features Implemented

- ✅ Search (users by name/email, projects/tasks by title) + pagination on all list views
- ✅ Filters (project status, task status, task priority)
- ✅ Dashboard chart (Chart.js doughnut chart of task status for Admin/Manager)
- ✅ Server-side form validation (`express-validator`) on all create/update forms
- ✅ Soft delete (`paranoid: true` on User/Project/Task)
- ✅ Basic JSON API endpoints under `/api/*` (`/api/me`, `/api/users`, `/api/projects`,
  `/api/tasks`, `/api/dashboard/stats`), protected by the same session + RBAC middleware

## 8. Useful npm scripts

| Script | What it does |
|---|---|
| `npm start` | Run the app |
| `npm run dev` | Run with nodemon (auto-restart) |
| `npm run db:migrate` | Apply migrations |
| `npm run db:migrate:undo` | Roll back all migrations |
| `npm run db:seed` | Run seeders |
| `npm run db:seed:undo` | Undo seeders |
| `npm run db:reset` | Undo + re-run migrations + seed |
| `npm run db:fresh` | Delete the SQLite file and rebuild from scratch |

## 9. Manually Verifying Role-Based Access (for grading)

1. Log in as `employee1@example.com` and try navigating directly to `/users` or `/projects/new`
   in the address bar — the server responds with a 403 page rather than the page rendering.
2. Log in as `manager@example.com` and confirm you can create/edit projects and tasks, but the
   delete buttons are absent and a direct `DELETE /projects/:id` request (or navigating to a
   nonexistent delete link) is rejected server-side.
3. Log in as `admin@example.com` to confirm full access to Users (create/edit/delete/assign
   role), Projects, and Tasks, plus global dashboard statistics.

## 10. Screenshots

_Add screenshots of the running app here before submission, e.g.:_
- Login page
- Admin dashboard
- Manager dashboard
- Employee dashboard
- Users management (Admin)
- Projects list & detail page
- Tasks list with status update
- A 403 page reached by typing a restricted URL directly

## 11. Publishing to GitHub

```bash
git init
git add .
git commit -m "Role-based dashboard: auth, RBAC, projects, tasks, dashboard stats"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

`.env` and `database.sqlite` are already excluded via `.gitignore` — don't commit real secrets.
