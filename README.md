# Task Tracker

A React + Supabase task management app with owner/manager roles, PWA support, and the visual design from Claude Design.

## Stack

- **Frontend** — React 18, Vite, React Router v6
- **Backend** — Supabase (Postgres + Auth + RLS)
- **PWA** — vite-plugin-pwa with offline caching via Workbox
- **Design** — Plus Jakarta Sans, CSS custom properties, three themes (Warm Paper / Cool Slate / Clean Mono)

---

## Local setup

### 1. Clone and install

```bash
cd "task tracker"
npm install
```

### 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Dashboard → **Settings → API**, copy:
   - Project URL
   - `anon` / public key

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and paste your values:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run the database migration

In the Supabase Dashboard → **SQL Editor**, open a new query, paste the entire contents of `supabase/migration.sql`, and click **Run**.

This creates all tables, indexes, RLS policies, and the auto-profile trigger.

### 5. Start the dev server

```bash
npm run dev
# → http://localhost:5173
```

---

## Data model

| Table | Description |
|---|---|
| `profiles` | One row per auth user. Stores `full_name`, `email`, `role` (`owner` \| `manager`). Auto-created on signup via DB trigger. |
| `categories` | Colour-coded task categories, owned by an owner. |
| `tasks` | Core task with `status`, `priority`, `due_date`, and FK to `categories`. |
| `task_steps` | Sub-steps within a task (timeline-style). Each has `input`, `outcome`, `notes`. |
| `step_comments` | Thread comments on a step, tied to a `user_id`. |
| `task_access` | Grants a manager read-only access to an owner's tasks. |

### Row-Level Security summary

- **Owners** — full CRUD on their own tasks, steps, categories, and access grants.
- **Managers** — `SELECT` only on tasks/steps/categories belonging to owners who shared with them; can insert their own comments.
- Any authenticated user can read all `profiles` rows (needed for the share-by-email lookup).

---

## Features

### Owner view (`/dashboard`)
- Create, edit, delete tasks with title, description, status, priority, due date, and category.
- List view and Kanban board view (toggle in the top-right).
- Filter by status (To Do / In Progress / Done / Blocked) and by category.
- Expand a task card to see its step timeline; add/toggle steps, fill in Input / Outcome / Notes.
- Leave comments on individual steps.
- **Share with manager** button: enter a manager's email to grant read-only access. Revoke access from the same modal.
- Three themes (Warm Paper, Cool Slate, Clean Mono), three shape modes, three density modes — all persisted in localStorage.

### Manager view (`/manager`)
- Appears automatically when a manager account logs in.
- Shows a "no access yet" screen with your email if no owner has shared yet.
- Once access is granted: summary stats (total / in-progress / done / blocked), filter by status and category, read-only task cards.
- Managers can leave comments on steps.
- If access to multiple owners is granted, a switcher appears at the top.

---

## PWA / iPhone home screen

The app includes a full PWA manifest and service worker (via vite-plugin-pwa).

**To add to iPhone home screen:**
1. Open the app in Safari.
2. Tap the Share button → **Add to Home Screen**.
3. The app opens in standalone (full-screen) mode.

**Icon files** — you need to add two PNG icons to `public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `apple-touch-icon.png` (180×180, for iOS)

You can generate them from `public/icons/icon.svg` using any image tool, or a service like [favicon.io](https://favicon.io/favicon-converter/).

---

## Deploying to Vercel

```bash
npm run build          # → dist/
```

1. Push the project to a GitHub repo.
2. Import the repo in [vercel.com](https://vercel.com/new).
3. Add environment variables in Vercel's project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Vercel auto-detects Vite and builds correctly.

For Supabase Auth to work on your production domain, add the domain to **Supabase → Authentication → URL Configuration → Redirect URLs**.

---

## Development notes

```
src/
  lib/supabase.js          Supabase client singleton
  contexts/
    AuthContext.jsx         Session, profile, signIn/Up/Out
    ThemeContext.jsx        Theme variables applied to :root CSS custom properties
  hooks/
    useTasks.js             CRUD + step operations for owner; fetchOwnerTasks for manager
    useCategories.js        Category CRUD + colour palette
  pages/
    AuthPage.jsx            Login / signup with role picker
    OwnerDashboard.jsx      Main owner task view
    ManagerDashboard.jsx    Read-only manager view
  components/
    layout/                 AppLayout (nav + theme panel), ProtectedRoute
    tasks/                  TaskCard, StepList, TaskForm, ShareModal
    common/                 Modal
```
