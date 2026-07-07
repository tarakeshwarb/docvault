const fs = require('fs');
const path = require('path');
const { Pool } = require("pg");

const env = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const match = env.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
const dbUrl = match ? match[1].trim() : null;

if (!dbUrl) throw new Error("No DATABASE_URL found");

async function setup() {
  const pool = new Pool({
    connectionString: dbUrl,
  });
  
  try {
    await pool.query(`
      create table if not exists public.course_broadcast (
        broadcast_id uuid primary key default gen_random_uuid(),
        offering_id uuid not null references public.course_offering(offering_id) on delete cascade,
        title text not null,
        r2_file_key text not null,
        file_name text not null,
        uploaded_by bigint references public.faculty(faculty_id) on delete set null,
        created_at timestamptz not null default now()
      );
      create index if not exists idx_course_broadcast_offering on public.course_broadcast(offering_id);
    `);
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR", err);
  } finally {
    await pool.end();
  }
}

setup();
