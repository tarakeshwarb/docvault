const { Pool } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].replace(/"/g, '').trim();

const pool = new Pool({ connectionString: dbUrl });
async function main() {
  const offering_id = '900515fb-4bbc-47dc-82b3-0870c0c5036f';
  // Get a component id
  const cmp = await pool.query(`SELECT component_id FROM public.component_main LIMIT 1`);
  if (!cmp.rows[0]) return;
  const component_id = cmp.rows[0].component_id;

  const assignments = await pool.query(`SELECT id, email FROM public.faculty_assignment fa JOIN public.faculty f ON fa.faculty_id = f.faculty_id WHERE offering_id = $1`, [offering_id]);
  
  let pendingCount = 0;
  for (const a of assignments.rows) {
    const raRows = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM public.result_analysis WHERE faculty_assignment_id = $1 AND component_id = $2) as count,
        (SELECT component_name FROM public.component_main WHERE component_id = $2 LIMIT 1) as component_name`,
      [a.id, component_id]
    );
    if (Number(raRows.rows[0].count) === 0) {
      pendingCount++;
    }
  }
  console.log(`Pending faculties: ${pendingCount}`);
  await pool.end();
}
main();
