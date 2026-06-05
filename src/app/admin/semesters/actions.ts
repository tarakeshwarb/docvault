"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type Semester = {
  semester_id: string;
  semester_name: string;
  year_id: string;
  is_active: boolean;
  created_at: string;
  year_name?: string; // joined
};

export async function getSemesters(): Promise<Semester[]> {
  try {
    return await queryDb<Semester>(`
      SELECT s.*, y.year_name 
      FROM public.semester_master s
      JOIN public.academic_year y ON s.year_id = y.year_id
      ORDER BY y.start_date DESC, s.semester_name ASC
    `);
  } catch (error) {
    console.error("Failed to fetch semesters:", error);
    return [];
  }
}

export async function getSemesterById(semester_id: string): Promise<Semester | null> {
  try {
    const rows = await queryDb<Semester>(
      `SELECT s.*, y.year_name 
       FROM public.semester_master s
       JOIN public.academic_year y ON s.year_id = y.year_id
       WHERE s.semester_id = $1 LIMIT 1`,
      [semester_id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Failed to fetch semester:", error);
    return null;
  }
}

export async function updateSemester(
  semester_id: string,
  data: { semester_name: string; year_id: string; is_active: boolean }
) {
  await executeDb(
    `UPDATE public.semester_master 
     SET semester_name = $1, year_id = $2, is_active = $3 
     WHERE semester_id = $4`,
    [data.semester_name, data.year_id, data.is_active, semester_id]
  );
  revalidatePath("/admin/semesters");
}

export async function deleteSemester(semester_id: string) {
  await executeDb(
    "DELETE FROM public.semester_master WHERE semester_id = $1",
    [semester_id]
  );
  revalidatePath("/admin/semesters");
}
