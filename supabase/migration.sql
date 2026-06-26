-- ============================================================
-- Task Tracker — Supabase migration
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- Tables
-- ──────────────────────────────────────────

create table if not exists profiles (
  id        uuid references auth.users on delete cascade primary key,
  full_name text        not null default '',
  email     text        not null default '',
  role      text        not null default 'owner'
              check (role in ('owner', 'manager')),
  created_at timestamptz default now()
);

create table if not exists categories (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references profiles(id) on delete cascade not null,
  name       text        not null,
  color      text        not null default '#8b5cf6',
  created_at timestamptz default now()
);

create table if not exists tasks (
  id          uuid        default uuid_generate_v4() primary key,
  user_id     uuid        references profiles(id) on delete cascade not null,
  category_id uuid        references categories(id) on delete set null,
  title       text        not null,
  description text        default '',
  status      text        not null default 'todo'
                check (status in ('todo', 'in_progress', 'done', 'blocked')),
  priority    text        not null default 'medium'
                check (priority in ('low', 'medium', 'high')),
  due_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists task_steps (
  id         uuid        default uuid_generate_v4() primary key,
  task_id    uuid        references tasks(id) on delete cascade not null,
  title      text        not null,
  done       boolean     not null default false,
  input      text        default '',
  outcome    text        default '',
  notes      text        default '',
  position   integer     not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists step_comments (
  id         uuid        default uuid_generate_v4() primary key,
  step_id    uuid        references task_steps(id) on delete cascade not null,
  user_id    uuid        references profiles(id) on delete cascade not null,
  text       text        not null,
  created_at timestamptz default now()
);

create table if not exists task_access (
  id         uuid        default uuid_generate_v4() primary key,
  owner_id   uuid        references profiles(id) on delete cascade not null,
  viewer_id  uuid        references profiles(id) on delete cascade not null,
  permission text        not null default 'read' check (permission in ('read')),
  created_at timestamptz default now(),
  unique(owner_id, viewer_id)
);

-- ──────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────

create index if not exists tasks_user_id_idx       on tasks(user_id);
create index if not exists tasks_status_idx        on tasks(status);
create index if not exists tasks_category_id_idx   on tasks(category_id);
create index if not exists task_steps_task_id_idx  on task_steps(task_id, position);
create index if not exists step_comments_step_idx  on step_comments(step_id);
create index if not exists task_access_owner_idx   on task_access(owner_id);
create index if not exists task_access_viewer_idx  on task_access(viewer_id);
create index if not exists categories_user_id_idx  on categories(user_id);
create index if not exists profiles_email_idx      on profiles(email);

-- ──────────────────────────────────────────
-- updated_at trigger
-- ──────────────────────────────────────────

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on tasks
  for each row execute procedure handle_updated_at();

create trigger task_steps_updated_at
  before update on task_steps
  for each row execute procedure handle_updated_at();

-- ──────────────────────────────────────────
-- Auto-create profile on signup
-- ──────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'owner')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ──────────────────────────────────────────
-- Row-Level Security
-- ──────────────────────────────────────────

alter table profiles     enable row level security;
alter table categories   enable row level security;
alter table tasks        enable row level security;
alter table task_steps   enable row level security;
alter table step_comments enable row level security;
alter table task_access  enable row level security;

-- profiles ─ authenticated users can read all (needed for share-by-email lookup)
create policy "Authenticated users read profiles"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

-- categories ─ owners CRUD; managers read
create policy "Owners manage own categories"
  on categories for all
  using (auth.uid() = user_id);

create policy "Managers read owner categories"
  on categories for select
  using (
    exists (
      select 1 from task_access ta
      where ta.viewer_id = auth.uid() and ta.owner_id = categories.user_id
    )
  );

-- tasks ─ owners CRUD; managers SELECT only
create policy "Owners manage own tasks"
  on tasks for all
  using (auth.uid() = user_id);

create policy "Managers read granted tasks"
  on tasks for select
  using (
    exists (
      select 1 from task_access ta
      where ta.viewer_id = auth.uid() and ta.owner_id = tasks.user_id
    )
  );

-- task_steps ─ follows task ownership
create policy "Task owners manage steps"
  on task_steps for all
  using (
    exists (
      select 1 from tasks t
      where t.id = task_steps.task_id and t.user_id = auth.uid()
    )
  );

create policy "Managers read steps"
  on task_steps for select
  using (
    exists (
      select 1 from tasks t
      join task_access ta on ta.owner_id = t.user_id
      where t.id = task_steps.task_id and ta.viewer_id = auth.uid()
    )
  );

-- step_comments ─ task owners manage all; managers can read + add their own
create policy "Task owners manage comments"
  on step_comments for all
  using (
    exists (
      select 1 from task_steps ts
      join tasks t on t.id = ts.task_id
      where ts.id = step_comments.step_id and t.user_id = auth.uid()
    )
  );

create policy "Managers read comments"
  on step_comments for select
  using (
    exists (
      select 1 from task_steps ts
      join tasks t on t.id = ts.task_id
      join task_access ta on ta.owner_id = t.user_id
      where ts.id = step_comments.step_id and ta.viewer_id = auth.uid()
    )
  );

create policy "Managers insert own comments"
  on step_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from task_steps ts
      join tasks t on t.id = ts.task_id
      join task_access ta on ta.owner_id = t.user_id
      where ts.id = step_comments.step_id and ta.viewer_id = auth.uid()
    )
  );

-- task_access ─ owners manage their grants; managers read own rows
create policy "Owners manage task_access"
  on task_access for all
  using (auth.uid() = owner_id);

create policy "Managers view own access"
  on task_access for select
  using (auth.uid() = viewer_id);
