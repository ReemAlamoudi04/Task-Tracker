# Task Tracker

A full-stack task management app built with React + Supabase. Features a calendar, team messaging, link-based sharing, and a rich step/subtask workflow — all wrapped in a themeable design with dark, light, and warm modes.

## Stack

- **Frontend** — React 18, Vite 5, React Router v6
- **Backend** — Supabase (Postgres + Auth + Row-Level Security)
- **PWA** — vite-plugin-pwa + Workbox (installable on iPhone)
- **Design** — Bricolage Grotesque + Syne, CSS custom properties, three themes (Midnight / Daylight / Mocha)

---

## Local setup

### 1. Clone and install

```bash
cd "task tracker"
npm install
```

### 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Dashboard → **Settings → API**, copy:
   - Project URL
   - `anon` / public key

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your values:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run the database migration

Dashboard → **SQL Editor → New query** → paste the full contents of `supabase/migration.sql` → click **Run** (confirm the warning).

This is safe to re-run — every statement is idempotent.

### 5. Start the dev server

```bash
npm run dev
# → http://localhost:5173
```

---

## Data model

| Table | Description |
|---|---|
| `profiles` | One row per auth user. `full_name`, `email`, `role`. Auto-created on signup via DB trigger. |
| `categories` | Colour-coded task categories, owned per user. |
| `tasks` | Task with `title`, `status`, `priority`, `due_date`, FK to `categories`. |
| `task_steps` | Timeline steps within a task. Each has `input`, `outcome`, `notes`, and a `substeps` JSONB array. |
| `step_comments` | Thread comments on a step. |
| `task_comments` | Thread comments at the task level (separate from step comments). |
| `task_access` | Grants another user `read` or `edit` access to an owner's tasks. |
| `invite_links` | UUID tokens used to generate shareable invite URLs. |

### Row-Level Security summary

- **Owners** — full CRUD on their own tasks, steps, categories, comments, and invite links.
- **Edit viewers** — can insert/update tasks and steps they've been granted edit access to; can comment.
- **Read viewers** — SELECT only on tasks/steps/categories/comments for owners who shared; can add their own comments.

---

## Features

### Dashboard (`/dashboard`)

- **Editable board title** — click the ✎ next to the title to rename it.
- **Category cards** — a grid showing each category with its task count. Click any card to filter. Click "+ Category" to add one with a colour picker.
- **Inline task creation** — click "+ New task" to expand a form with a title field and category picker inline (no modal).
- **Task cards** — colour-bar, category badge, status dropdown, priority dot, progress bar, 💬 comment count badge.
- **Step timeline** — expand a task to see its steps. Each step has:
  - Toggle circle to mark done
  - **Subtasks** — small checkbox list below the step title (add, toggle, delete)
  - **Details panel** — Input / Outcome / Notes textareas + step comments thread
- **Task comments** — a separate comment thread at the bottom of every expanded task card.
- **Three themes** — Midnight (dark), Daylight (light), Mocha (warm) — with three shape modes (Soft / Editorial / Sharp) and three density modes (Cozy / Compact / Airy). All persisted in localStorage.

### Schedule section

A full weekly calendar built into the dashboard, stored in localStorage.

- Navigate by week or month; jump to today.
- **Click any cell** to open the add-event form pre-filled with that day/time.
- **Add event form** — title, Task or Meeting type, date, start time, duration, category.
- **Drag the bottom edge** of an event block to extend its duration.
- **Double-click** an event to delete it.
- Task events are tinted with their category colour; Meeting events use the accent gradient.

### Messages section

A simple team notes board at the bottom of the dashboard, stored in localStorage.

- Your messages appear right-aligned with accent gradient bubbles.
- Press Enter or click Send.

### Sharing (`/shared`)

Link-based sharing — no email lookup required.

1. Click **👤 Share** on your dashboard.
2. Pick a permission level:
   - **View** — can see tasks and leave comments. Cannot add or change anything.
   - **Edit** — can add tasks, add steps, and update task status.
3. Click **Generate invite link** → copy the URL and send it.
4. The recipient opens the link, logs in (or signs up), and clicks **Accept invite**.
5. Their **"Shared with me"** tab appears automatically in the nav.

To revoke: open Share → click **Revoke** next to the link, or **Remove** next to a person.

---

## PWA / iPhone home screen

1. Open the deployed URL in **Safari on iPhone**.
2. Tap the Share icon → **Add to Home Screen**.
3. The app launches in full-screen standalone mode.

**Required icon files** (add to `public/icons/`):

| File | Size |
|---|---|
| `icon-192.png` | 192×192 |
| `icon-512.png` | 512×512 |
| `apple-touch-icon.png` | 180×180 |

Generate from `public/icons/icon.svg` using [favicon.io](https://favicon.io/favicon-converter/) or any image tool.

---

## Deploying to Vercel

```bash
npm run build   # → dist/
```

1. Push to a GitHub repo.
2. Import at [vercel.com/new](https://vercel.com/new).
3. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite.
5. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to both **Site URL** and **Redirect URLs**.

---

## Project structure

```
src/
  lib/
    supabase.js               Supabase client singleton
  contexts/
    AuthContext.jsx           Session, profile, signIn/Up/Out
    ThemeContext.jsx          Theme vars applied to :root CSS custom properties
  hooks/
    useTasks.js               Task/step/comment CRUD; fetchOwnerTasks for shared view
    useCategories.js          Category CRUD + colour palette
  pages/
    AuthPage.jsx              Login / signup (invite-aware)
    OwnerDashboard.jsx        Main dashboard: tasks, calendar, messages
    ManagerDashboard.jsx      Shared-with-me view (read or edit permission)
    InvitePage.jsx            Invite acceptance flow (/invite/:token)
  components/
    layout/
      AppLayout.jsx           Sticky nav, theme panel, "Shared with me" tab
      ProtectedRoute.jsx      Auth guard
    tasks/
      TaskCard.jsx            Card with steps, subtasks, task comments
      StepList.jsx            Step timeline with subtasks and detail panel
      TaskForm.jsx            New task modal (used in shared edit view)
      ShareModal.jsx          Generate invite links, manage access
      CalendarSection.jsx     Week-view calendar (localStorage)
      MessagesSection.jsx     Chat-style messages (localStorage)
    common/
      Modal.jsx               Generic modal wrapper
supabase/
  migration.sql               Idempotent schema: tables, RLS, triggers
```
