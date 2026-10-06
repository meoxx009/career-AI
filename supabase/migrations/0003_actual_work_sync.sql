-- Migration: 0003_actual_work_sync.sql
-- Additive forward-only migration for storing learner-reported actual work accomplishments.
-- Preserves existing tables, rows, constraints, and RLS policies from 0001_initial.sql and 0002.

alter table public.roadmap_tasks
  add column if not exists actual_work jsonb;
