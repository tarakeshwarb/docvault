"use server";

import { queryDb } from "@/lib/db";

import { requireEnv } from "@/lib/env";

export type AuditLog = {
  log_id: string;
  file_name: string;
  version: number;
  uploaded_at: string;
  uploaded_by: string;
  course_code: string;
  course_name: string;
  section_name: string;
  component_name: string;
  semester_name: string;
  year_name: string;
  file_url: string;
};

/**
 * Audit trail of uploaded files.
 * An audit professor only sees files for the subject(s) they are assigned to
 * (public.audit_assignment). Admins see everything.
 */
export async function getAuditLogs(params?: {
  facultyId?: number;
  isAdmin?: boolean;
}): Promise<AuditLog[]> {
  const scoped = !params?.isAdmin && params?.facultyId != null;
  const whereClause = scoped
    ? `WHERE fa.offering_id IN (
         SELECT offering_id FROM public.audit_assignment WHERE faculty_id = $1
       )`
    : "";

  const query = `
    SELECT
      fm.s3_object_key as log_id,
      fm.file_name,
      fm.version,
      s.submitted_at as uploaded_at,
      f.faculty_name as uploaded_by,
      cm.course_code,
      cm.course_name,
      sec.section_name,
      cmp.component_name,
      sm.semester_name,
      ay.year_name,
      fm.s3_object_key as r2_object_key
    FROM public.file_metadata fm
    JOIN public.submission s ON fm.submission_id = s.submission_id
    JOIN public.faculty_assignment fa ON s.faculty_assignment_id = fa.id
    JOIN public.faculty f ON fa.faculty_id = f.faculty_id
    JOIN public.course_component cc ON s.course_component_id = cc.id
    JOIN public.component_master cmp ON cc.component_id = cmp.component_id
    JOIN public.section_master sec ON fa.section_id = sec.section_id
    JOIN public.course_offering co ON fa.offering_id = co.offering_id
    JOIN public.course_master cm ON co.course_id = cm.course_id
    JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    JOIN public.academic_year ay ON sm.year_id = ay.year_id
    ${whereClause}
    ORDER BY s.submitted_at DESC
  `;

  const rows = await queryDb<Omit<AuditLog, "file_url"> & { r2_object_key: string }>(
    query,
    scoped ? [params!.facultyId!] : []
  );
  const baseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

  return rows.map((row) => ({
    ...row,
    file_url: `${baseUrl}/${row.r2_object_key}`,
  })) as AuditLog[];
}

export async function getAcademicYears() {
  return queryDb<{ year_id: string; year_name: string }>(
    "SELECT * FROM public.academic_year ORDER BY start_date DESC"
  );
}

export async function getSemesters(year_id?: string) {
  if (year_id) {
    return queryDb<{ semester_id: string; semester_name: string; is_active: boolean }>(
      "SELECT * FROM public.semester_master WHERE year_id = $1 ORDER BY start_date DESC",
      [year_id]
    );
  }
  return queryDb<{ semester_id: string; semester_name: string; is_active: boolean }>(
    "SELECT * FROM public.semester_master ORDER BY start_date DESC"
  );
}
