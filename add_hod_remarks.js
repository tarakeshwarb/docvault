const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.knnexrezbnaonjxaeerk:hS9j9%2Cg9dd%2BPSEw@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await pool.query('ALTER TABLE public.submission ADD COLUMN IF NOT EXISTS hod_remarks TEXT;');
    console.log('Successfully added hod_remarks column.');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await pool.end();
  }
}

run();
