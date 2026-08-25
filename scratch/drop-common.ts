import { executeDb } from "../src/lib/db";

async function run() {
  try {
    console.log("Dropping common component columns...");
    await executeDb(`
      ALTER TABLE public.course_component 
      DROP COLUMN IF EXISTS is_common,
      DROP COLUMN IF EXISTS common_file_key,
      DROP COLUMN IF EXISTS common_file_name,
      DROP COLUMN IF EXISTS common_uploaded_by,
      DROP COLUMN IF EXISTS common_uploaded_at;
    `);
    console.log("Success.");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

run();
