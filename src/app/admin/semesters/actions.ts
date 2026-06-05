"use server";

import { queryDb, executeDb } from "@/lib/db";

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
