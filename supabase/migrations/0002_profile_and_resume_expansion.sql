-- Migration: 0002_profile_and_resume_expansion.sql
-- Additive forward-only migration for profile and resume expansion.
-- Preserves existing tables, rows, constraints, and RLS policies from 0001_initial.sql.

-- 1. Profiles Table Expansion
alter table public.profiles
  add column if not exists username text,
  add column if not exists contact_email text,
  add column if not exists profile_image_url text,
  add column if not exists profile_image_storage_key text,
  add column if not exists learner_stage text,
  add column if not exists school_class text,
  add column if not exists stream text,
  add column if not exists degree text,
  add column if not exists specialization text,
  add column if not exists institution text,
  add column if not exists expected_graduation_year text,
  add column if not exists cgpa text,
  add column if not exists current_skills text[] not null default '{}',
  add column if not exists interests text[] not null default '{}',
  add column if not exists favorite_subjects text[] not null default '{}',
  add column if not exists preferred_work_direction text,
  add column if not exists project_facts text,
  add column if not exists target_role_id bigint references public.career_roles(id) on delete set null,
  add column if not exists target_role_slug text,
  add column if not exists portfolio_url text,
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists font_size_preference text default 'default';

-- 2. Roadmap Tasks Expansion for Durable Identity & Split Segments
alter table public.roadmap_tasks
  add column if not exists template_id text,
  add column if not exists parent_task_id text,
  add column if not exists segment_index smallint default 0,
  add column if not exists segment_count smallint default 1,
  add column if not exists scheduled_hours numeric(5,2),
  add column if not exists skill_id text,
  add column if not exists skill_name text,
  add column if not exists prerequisite_template_id text;

-- 3. Resume Documents Expansion for Facts Grounding and Role Scoping
alter table public.resume_documents
  add column if not exists facts jsonb not null default '[]'::jsonb,
  add column if not exists suggestions jsonb not null default '[]'::jsonb,
  add column if not exists role_id bigint references public.career_roles(id) on delete set null;

-- 4. Helpful Performance Indexes
create index if not exists idx_profiles_target_role on public.profiles(target_role_id);
create index if not exists idx_roadmaps_user_role on public.roadmaps(user_id, role_id);
create index if not exists idx_roadmap_tasks_template on public.roadmap_tasks(roadmap_id, template_id);
create index if not exists idx_resume_documents_user on public.resume_documents(user_id, role_id);
