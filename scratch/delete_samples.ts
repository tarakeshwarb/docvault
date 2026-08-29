import { executeDb } from '../src/lib/db';

async function deleteSamples() {
  try {
    await executeDb("DELETE FROM public.course_master WHERE course_code LIKE 'SAMPLE%'");
    console.log("Deleted sample courses successfully!");
  } catch (err) {
    console.error("Error:", err);
  }
}

deleteSamples();
