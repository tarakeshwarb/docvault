-- ==========================================================================
-- Common components (Phase 3) — run this in the Supabase SQL Editor.
-- Some components (CT question paper, answer key, course plan) are the SAME
-- file for every section, so the coordinator uploads it ONCE and faculty only
-- view it — no per-faculty duplicate copies. Safe to re-run.
-- ==========================================================================

alter table public.course_component add column if not exists is_common boolean not null default false;
alter table public.course_component add column if not exists common_file_key text;
alter table public.course_component add column if not exists common_file_name text;
alter table public.course_component add column if not exists common_uploaded_by bigint references public.faculty(faculty_id) on delete set null;
alter table public.course_component add column if not exists common_uploaded_at timestamptz;
