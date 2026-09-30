const { Pool } = require('pg');

async function apply() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  const sql = `
CREATE TABLE IF NOT EXISTS public.component_reviewer (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_component_id uuid NOT NULL REFERENCES public.course_component(id) ON DELETE CASCADE,
  faculty_id bigint NOT NULL REFERENCES public.faculty(faculty_id) ON DELETE CASCADE,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(course_component_id, faculty_id)
);

ALTER TABLE public.component_reviewer ENABLE ROW LEVEL SECURITY;
  `;

  try {
    console.log('Applying schema...');
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

apply();
