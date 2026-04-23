-- Run this SQL in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  notifications boolean not null default true,
  auto_download boolean not null default false,
  openai_api_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  mode text not null check (mode in ('user-story', 'code-upload')),
  language text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  file_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  mode text not null check (mode in ('user-story', 'code-upload')),
  architecture_diagram text,
  usecase_diagram text,
  sequence_diagram text,
  controlflow_diagram text,
  class_diagram text,
  architecture_diagram_image_path text,
  usecase_diagram_image_path text,
  sequence_diagram_image_path text,
  controlflow_diagram_image_path text,
  class_diagram_image_path text,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text not null,
  type text not null check (type in ('whitebox', 'blackbox')),
  input text not null,
  expected_output text not null,
  code text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  language text,
  size_bytes bigint,
  storage_path text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.analysis_results enable row level security;
alter table public.test_cases enable row level security;
alter table public.project_files enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "analysis_results_owner_all" on public.analysis_results;
create policy "analysis_results_owner_all" on public.analysis_results
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = analysis_results.project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = analysis_results.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "test_cases_owner_all" on public.test_cases;
create policy "test_cases_owner_all" on public.test_cases
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = test_cases.project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = test_cases.project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "project_files_owner_all" on public.project_files;
create policy "project_files_owner_all" on public.project_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
