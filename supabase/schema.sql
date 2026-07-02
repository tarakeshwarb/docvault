create extension if not exists "pgcrypto";

-- ==========================================
-- MASTER TABLES
-- ==========================================

create table if not exists public.faculty (
  faculty_id bigint primary key,
  faculty_name text not null,
  designation text not null,
  email text not null unique,
  mobile_no text,
  role text not null default 'faculty',
  created_at timestamptz not null default now(),
  constraint faculty_role_check
    check (role in ('admin', 'hod', 'course_coordinator', 'secondary_coordinator', 'faculty'))
);

create table if not exists public.department_master (
  department_id uuid primary key default gen_random_uuid(),
  department_name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.course_master (
  course_id uuid primary key default gen_random_uuid(),
  course_code text not null unique,
  course_name text not null,
  credits integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_year (
  year_id uuid primary key default gen_random_uuid(),
  year_name text not null unique, -- e.g., "2023-2024"
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.semester_master (
  semester_id uuid primary key default gen_random_uuid(),
  semester_name text not null, -- e.g., "Odd", "Even"
  year_id uuid not null references public.academic_year(year_id) on delete cascade,
  is_active boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.section_master (
  section_id uuid primary key default gen_random_uuid(),
  section_name text not null, -- e.g., "A", "B", "C"
  created_at timestamptz not null default now()
);

create table if not exists public.component_master (
  component_id uuid primary key default gen_random_uuid(),
  component_name text not null unique, -- e.g., "Lesson Plan", "CT1 Question Paper"
  created_at timestamptz not null default now()
);

create table if not exists public.template_master (
  template_id uuid primary key default gen_random_uuid(),
  template_name text not null,
  r2_template_path text not null,
  created_at timestamptz not null default now()
);


-- ==========================================
-- RELATIONAL & TRANSACTIONAL TABLES
-- ==========================================

create table if not exists public.course_offering (
  offering_id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.course_master(course_id) on delete cascade,
  semester_id uuid not null references public.semester_master(semester_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, semester_id)
);

create table if not exists public.coordinator_assignment (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
  faculty_id bigint not null references public.faculty(faculty_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (offering_id, faculty_id)
);

create table if not exists public.secondary_coordinator_assignment (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
  faculty_id bigint not null references public.faculty(faculty_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (offering_id, faculty_id)
);

create table if not exists public.audit_assignment (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
  faculty_id bigint not null references public.faculty(faculty_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (offering_id, faculty_id)
);

create table if not exists public.faculty_assignment (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
  faculty_id bigint not null references public.faculty(faculty_id) on delete cascade,
  section_id uuid not null references public.section_master(section_id) on delete cascade,
  student_count integer default 0,
  created_at timestamptz not null default now(),
  unique (offering_id, faculty_id, section_id)
);

create table if not exists public.course_component (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
  component_id uuid not null references public.component_master(component_id) on delete cascade,
  deadline timestamptz,
  template_id uuid references public.template_master(template_id) on delete set null,
  mandatory boolean default true,
  created_at timestamptz not null default now(),
  unique (offering_id, component_id)
);

create table if not exists public.submission (
  submission_id uuid primary key default gen_random_uuid(),
  faculty_assignment_id uuid not null references public.faculty_assignment(id) on delete cascade,
  course_component_id uuid not null references public.course_component(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'submitted', 'late'
  submitted_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  unique (faculty_assignment_id, course_component_id)
);

create table if not exists public.file_metadata (
  file_id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submission(submission_id) on delete cascade,
  file_name text not null,
  r2_object_key text not null,
  file_size integer,
  uploaded_at timestamptz not null default now(),
  version integer default 1
);

create table if not exists public.generated_report (
  report_id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
  report_type text not null,
  generated_by bigint references public.faculty(faculty_id) on delete set null,
  generated_at timestamptz not null default now(),
  r2_report_path text not null
);

create table if not exists public.report_template (
  template_id uuid primary key default gen_random_uuid(),
  template_name text not null,
  template_type text not null default 'consolidated_report',
  description text,
  r2_template_path text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.semester_archive (
  archive_id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semester_master(semester_id) on delete cascade,
  archive_label text not null,
  archive_path text not null,
  archived_by bigint references public.faculty(faculty_id) on delete set null,
  archived_at timestamptz not null default now(),
  notes text
);

create table if not exists public.activity_log (
  activity_id uuid primary key default gen_random_uuid(),
  actor_faculty_id bigint references public.faculty(faculty_id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification (
  notification_id uuid primary key default gen_random_uuid(),
  recipient_faculty_id bigint references public.faculty(faculty_id) on delete cascade,
  title text not null,
  body text not null,
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_offering_semester on public.course_offering(semester_id);
create index if not exists idx_course_offering_course on public.course_offering(course_id);
create index if not exists idx_coordinator_assignment_offering on public.coordinator_assignment(offering_id);
create index if not exists idx_coordinator_assignment_faculty on public.coordinator_assignment(faculty_id);
create index if not exists idx_secondary_coordinator_assignment_offering on public.secondary_coordinator_assignment(offering_id);
create index if not exists idx_secondary_coordinator_assignment_faculty on public.secondary_coordinator_assignment(faculty_id);
create index if not exists idx_audit_assignment_offering on public.audit_assignment(offering_id);
create index if not exists idx_audit_assignment_faculty on public.audit_assignment(faculty_id);
create index if not exists idx_faculty_assignment_offering on public.faculty_assignment(offering_id);
create index if not exists idx_faculty_assignment_faculty on public.faculty_assignment(faculty_id);
create index if not exists idx_course_component_offering on public.course_component(offering_id);
create index if not exists idx_submission_assignment on public.submission(faculty_assignment_id);
create index if not exists idx_submission_component on public.submission(course_component_id);
create index if not exists idx_generated_report_offering on public.generated_report(offering_id);
create index if not exists idx_activity_log_created_at on public.activity_log(created_at desc);
create index if not exists idx_notification_recipient on public.notification(recipient_faculty_id);

-- ==========================================
-- SEED DATA
-- ==========================================

insert into public.faculty (
  faculty_id,
  faculty_name,
  designation,
  email,
  mobile_no,
  role
) values
  (100174, 'Dr. Annie Uthra R', 'Professor & Head', 'annieu@srmist.edu.in', '9840242690', 'admin'),
  (100161, 'Dr. C. Lakshmi', 'Professor & Asso. Chair', 'lakshmic@srmist.edu.in', '9345495431', 'course_coordinator'),
  (101928, 'Dr. Maragatham G', 'Professor', 'maragatg@srmist.edu.in', '9445307329', 'course_coordinator'),
  (102221, 'Dr. Saad Yunus Sait', 'Professor', 'saady@srmist.edu.in', '9884355338', 'course_coordinator'),
  (101944, 'Dr. M. Ferni Ukrit', 'Professor', 'ferniukm@srmist.edu.in', '9176634432', 'course_coordinator'),
  (100492, 'Dr. M. Uma', 'Professor', 'umam@srmist.edu.in', '9841245766', 'course_coordinator'),
  (102450, 'Dr. A. Alice Nithya', 'Professor', 'alicenia@srmist.edu.in', '9962872633', 'course_coordinator'),
  (103694, 'Dr. V Antony Aroul Raj', 'Professor', 'antonyav@srmist.edu.in', '9841143112', 'course_coordinator'),
  (102769, 'Dr. C. Amuthadevi', 'Associate Professor', 'amuthadc@srmist.edu.in', '9944333907', 'faculty'),
  (100197, 'Dr. T. S. Shiny Angel', 'Associate Professor', 'shinyant@srmist.edu.in', '9840569586', 'faculty'),
  (100489, 'Dr. M. S. Abirami', 'Associate Professor', 'abiramim@srmist.edu.in', '9841075462', 'faculty'),
  (100188, 'Dr. N. Snehalatha', 'Associate Professor', 'snehalan@srmist.edu.in', '9884956441', 'faculty'),
  (100183, 'Dr. S. Karthick', 'Associate Professor (Deputed to COE)', 'karthiks2@srmist.edu.in', '9840772582', 'faculty'),
  (100195, 'Dr. G. Senthil Kumar', 'Associate Professor', 'senthilg1@srmist.edu.in', '9884227306', 'faculty'),
  (100932, 'Dr. S. Krishnaveni', 'Associate Professor', 'krishnas4@srmist.edu.in', '9841190067', 'faculty'),
  (100381, 'Dr. Arivazhagan N.', 'Associate Professor (Deputed to COE)', 'arivazhn@srmist.edu.in', '9841276616', 'faculty'),
  (101570, 'Dr. S. Selvakumara Samy', 'Associate Professor', 'selvakus1@srmist.edu.in', '9884020561', 'faculty'),
  (102709, 'Dr. B. Hariharan', 'Associate Professor', 'hariharb@srmist.edu.in', '9841823154', 'faculty'),
  (102751, 'Dr. T. R. Saravanan', 'Associate Professor', 'saravant1@srmist.edu.in', '9841644189', 'faculty'),
  (101590, 'Dr. S. Amudha', 'Associate Professor', 'amudhas@srmist.edu.in', '9791994531', 'faculty'),
  (102710, 'Dr. R. Siva', 'Associate Professor', 'sivar@srmist.edu.in', '9042387268', 'faculty'),
  (102733, 'Dr. A. Revathi', 'Associate Professor', 'revathia1@srmist.edu.in', '9445279539', 'faculty'),
  (102782, 'Dr. S. Sadagopan', 'Associate Professor', 'sadagops@srmist.edu.in', '9445279539', 'faculty'),
  (10235,  'Dr. Deiva Preetha', 'Associate Professor', 'deivap@srmist.edu.in', '9840231489', 'faculty'),
  (101257, 'Dr. S. Aruna', 'Associate Professor', 'arunas@srmist.edu.in', '9444076627', 'faculty'),
  (101565, 'Dr. B. Jothi', 'Associate Professor', 'jothib@srmist.edu.in', '9677741348', 'faculty'),
  (101714, 'Dr. M. Maheswari', 'Associate Professor', 'maheswam@srmist.edu.in', '9941133996', 'faculty'),
  (102829, 'Dr. R. Beaulah Jeyavathana', 'Associate Professor', 'beaulahj@srmist.edu.in', '7094633221', 'faculty'),
  (102856, 'Dr. Athira M. Nambiar', 'Research Associate Professor', 'athiram@srmist.edu.in', '7994309103', 'faculty'),
  (102868, 'Dr. S. Nagendra Prabhu', 'Associate Professor', 'nagendrs@srmist.edu.in', '7548844997', 'faculty'),
  (102876, 'Dr. A. Robert Singh', 'Associate Professor', 'robertsa@srmist.edu.in', '8056171730', 'faculty'),
  (102877, 'Dr. Sudha Rajesh', 'Associate Professor', 'sudhar3@srmist.edu.in', '9445959163', 'faculty'),
  (102893, 'Dr. R. Babu', 'Associate Professor', 'babur@srmist.edu.in', '7010691102', 'faculty'),
  (102906, 'Dr. A. Maheshwari', 'Associate Professor', 'maheshwa1@srmist.edu.in', '9884427554', 'faculty'),
  (102946, 'Dr. G. Sumathy', 'Associate Professor', 'sumathyg@srmist.edu.in', '9789013378', 'faculty'),
  (102973, 'Dr. U. Sakthi', 'Associate Professor', 'sakthiu@srmist.edu.in', '9444851523', 'faculty'),
  (100617, 'Dr. Sasi Rekha Sankar', 'Assistant Professor', 'sasireks@srmist.edu.in', '9884974834', 'faculty'),
  (101139, 'Mrs. Vidhya J. V', 'Assistant Professor', 'vidhyaj@srmist.edu.in', '9791929290', 'faculty'),
  (101246, 'Dr. Anupama C. G', 'Assistant Professor (Deputed to IR office)', 'anupamag@srmist.edu.in', '9677133931', 'faculty'),
  (101247, 'Dr. Anitha D', 'Assistant Professor', 'anithad@srmist.edu.in', '9790778559', 'faculty'),
  (101370, 'Dr. A. Jackulin Mahariba', 'Assistant Professor', 'jackulia@srmist.edu.in', '9841088361', 'faculty'),
  (101407, 'Dr. A. L. Amutha', 'Assistant Professor', 'amuthaa1@srmist.edu.in', '8608200820', 'faculty'),
  (101566, 'Dr. J. Jeyasudha', 'Assistant Professor', 'jeyasudj@srmist.edu.in', '9677218221', 'faculty'),
  (101874, 'Dr. C. Arun', 'Assistant Professor', 'arunc@srmist.edu.in', '9952955245', 'faculty'),
  (101959, 'Dr. S. Joseph James', 'Assistant Professor', 'josephjs@srmist.edu.in', '8489133936', 'faculty'),
  (102722, 'Dr. Vimaladevi M', 'Assistant Professor', 'vimaladm@srmist.edu.in', '9442365903', 'faculty'),
  (102781, 'Dr. E. Poongothai', 'Assistant Professor', 'poongote@srmist.edu.in', '9677254144', 'faculty'),
  (102818, 'Dr. P. G. Om Prakash', 'Assistant Professor', 'omp@srmist.edu.in', '8124133809', 'faculty')
on conflict (faculty_id) do update set
  faculty_name = excluded.faculty_name,
  designation = excluded.designation,
  email = excluded.email,
  mobile_no = excluded.mobile_no,
  role = excluded.role;

-- Insert some default component masters as examples
insert into public.component_master (component_name) values
  ('Student List'),
  ('Course Plan'),
  ('Lesson Plan'),
  ('CT1 Question Paper'),
  ('CT1 Mark Sheet'),
  ('CT1 Answer Key'),
  ('CT2 Question Paper'),
  ('CT2 Mark Sheet'),
  ('CT2 Answer Key'),
  ('Assignments'),
  ('Laboratory Records'),
  ('Attendance Records'),
  ('Internal Assessment Reports'),
  ('Result Analysis'),
  ('CO-PO Mapping'),
  ('Question Bank'),
  ('End Semester Exam Documents')
on conflict (component_name) do nothing;

-- ==========================================
-- MIGRATION NOTES
-- ==========================================
-- Run the following in Supabase SQL Editor if you have existing data:
-- 1. Create secondary_coordinator_assignment table for secondary coordinators
-- 2. Create audit_assignment table для audit professors
-- 3. Add indexes for performance
-- 4. Update faculty role constraint to include 'secondary_coordinator'
-- 5. If you have existing coordinator_assignment with is_primary column, migrate secondary coordinators to new table

-- Migration script for existing databases:
-- ALTER TABLE public.faculty DROP CONSTRAINT IF EXISTS faculty_role_check;
-- ALTER TABLE public.faculty ADD CONSTRAINT faculty_role_check CHECK (role in ('admin', 'hod', 'course_coordinator', 'secondary_coordinator', 'faculty'));
