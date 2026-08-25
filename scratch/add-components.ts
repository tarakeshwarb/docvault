import { executeDb } from "../src/lib/db";

async function run() {
  const components = [
    "FT - I",
    "FT - II",
    "FT - III",
    "FT - IV",
    "LLT - I",
    "Final Examination"
  ];

  console.log("Adding components to component_master...");

  for (const name of components) {
    try {
      await executeDb("INSERT INTO public.component_master (component_name) VALUES ($1) ON CONFLICT DO NOTHING", [name]);
      console.log(`Added: ${name}`);
    } catch (e) {
      console.error(`Error adding ${name}:`, e);
    }
  }

  console.log("Done.");
  process.exit(0);
}

run();
