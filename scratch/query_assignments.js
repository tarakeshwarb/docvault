const { Pool } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].replace(/"/g, '').trim();

const pool = new Pool({
  connectionString: dbUrl
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'faculty_assignment'
    `);
    console.log("Schema for faculty_assignment:");
    console.log(res.rows);

    const offering_id = '900515fb-4bbc-47dc-82b3-0870c0c5036f';
    const dept_id = '531f1138-d805-4216-9b8e-738acd42a83c';

    // Check if it's directly on the table
    const res2 = await pool.query(`
      SELECT COUNT(*) FROM public.faculty_assignment 
      WHERE offering_id = $1 AND department_id = $2
    `, [offering_id, dept_id]);
    console.log(`Count with department_id directly: ${res2.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
