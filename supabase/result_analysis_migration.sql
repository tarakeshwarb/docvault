-- ==========================================================================
-- Result Analysis (Phase 5) — run this in the Supabase SQL Editor
-- Safe to run more than once (uses "if not exists").
-- ==========================================================================

create table if not exists public.result_analysis (
  analysis_id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
  faculty_assignment_id uuid not null references public.faculty_assignment(id) on delete cascade,
  component_id uuid not null references public.component_master(component_id) on delete cascade,
  total_strength integer not null default 0,
  total_absentees integer not null default 0,
  range_0_49 integer not null default 0,
  range_50_59 integer not null default 0,
  range_60_69 integer not null default 0,
  range_70_79 integer not null default 0,
  range_80_89 integer not null default 0,
  range_90_100 integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (faculty_assignment_id, component_id)
);

create index if not exists idx_result_analysis_offering on public.result_analysis(offering_id);
create index if not exists idx_result_analysis_component on public.result_analysis(component_id);
create index if not exists idx_result_analysis_assignment on public.result_analysis(faculty_assignment_id);
