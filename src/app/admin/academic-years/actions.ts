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

export async function getAcademicYearById(year_id: string): Promise<AcademicYear | null> {
  try {
    const rows = await queryDb<AcademicYear>(
      "SELECT * FROM public.academic_year WHERE year_id = $1 LIMIT 1",
      [year_id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Failed to fetch academic year:", error);
    return null;
  }
}

export async function updateAcademicYear(
  year_id: string,
  data: { year_name: string; start_date?: string; end_date?: string }
) {
  await executeDb(
    `UPDATE public.academic_year 
     SET year_name = $1, start_date = $2, end_date = $3 
     WHERE year_id = $4`,
    [
      data.year_name,
      data.start_date ? new Date(data.start_date).toISOString() : null,
      data.end_date ? new Date(data.end_date).toISOString() : null,
      year_id,
    ]
  );
  revalidatePath("/admin/academic-years");
}

export async function deleteAcademicYear(year_id: string) {
  await executeDb(
    "DELETE FROM public.academic_year WHERE year_id = $1",
    [year_id]
  );
  revalidatePath("/admin/academic-years");
}
