"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type AcademicYear = {
  year_id: string;
  year_name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export async function getAcademicYears(): Promise<AcademicYear[]> {
  try {
    return await queryDb<AcademicYear>(
      "SELECT * FROM public.academic_year ORDER BY start_date DESC"
    );
  } catch (error) {
    console.error("Failed to fetch academic years:", error);
    return [];
  }
}
