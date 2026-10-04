const xlsx = require('xlsx');
const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].replace(/"/g, '').trim();

const pool = new Pool({ connectionString: dbUrl });

async function main() {
  try {
    const workbook = xlsx.readFile('CINTEL.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const excelData = xlsx.utils.sheet_to_json(sheet);

    const offering_id = '900515fb-4bbc-47dc-82b3-0870c0c5036f';
    const dept_id = '531f1138-d805-4216-9b8e-738acd42a83c';

    const dbRes = await pool.query(`
      SELECT faculty_id, section_name FROM public.faculty_assignment 
      WHERE offering_id = $1 AND department_id = $2
    `, [offering_id, dept_id]);

    const dbSections = new Set(dbRes.rows.map(r => r.section_name));
    
    const excelSections = new Set();
    excelData.forEach(row => {
      const sec = row['Section'] || row['section'] || row['section_name'];
      if (sec) excelSections.add(sec);
    });

    const dbSectionsNotInExcel = [];
    dbSections.forEach(sec => {
      if (!excelSections.has(sec)) {
        dbSectionsNotInExcel.push(sec);
      }
    });

    console.log(`Found ${dbSectionsNotInExcel.length} sections in the DB that are NOT in the Excel sheet.`);
    console.log(dbSectionsNotInExcel);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
