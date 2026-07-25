-- ==========================================================================
-- Approval gate (Phase 3) — run this in the Supabase SQL Editor.
-- Faculty uploads sit as 'submitted'; a coordinator (main or secondary)
-- approves, moving the submission to 'approved'. Safe to re-run.
-- ==========================================================================

alter table public.submission
  add column if not exists approved_by bigint references public.faculty(faculty_id) on delete set null;

alter table public.submission
  add column if not exists approved_at timestamptz;
