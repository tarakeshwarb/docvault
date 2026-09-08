"use server";

import { queryDb } from "@/lib/db";

export type AuditFacultySubmission = {
  assignment_id: string;
  faculty_id: number;
  faculty_name: string;
  course_code: string;
  course_name: string;
  section_name: string;
  batch: number;
  semester_name: string;
  year_name: string;
  submission_id: string | null;
  component_name: string | null;
  status: "pending" | "submitted" | "unsubmitted" | null;
  submitted_at: string | null;
  file_id: string | null;
  file_name: string | null;
  version: number | null;
  file_url: string | null;
};

/**
 * Fetches ALL faculty assignments for the relevant course offerings,
 * with their full submission trail including:
 * - submitted: files present
 * - unsubmitted: was submitted but files deleted by faculty
 * - pending: never submitted
 *
 * An audit professor only sees data for their assigned offerings.
 * Admins see everything.
 */
export async function getAuditData(params?: {
  facultyId?: number;
  isAdmin?: boolean;
}): Promise<AuditFacultySubmission[]> {
  const scoped = !params?.isAdmin && params?.facultyId != null;
  const whereClause = scoped
    ? `WHERE fa.offering_id IN (
         SELECT offering_id FROM public.audit_assignment WHERE faculty_id = $1
       )`
    : "";

  const query = `
    SELECT
      fa.id                   AS assignment_id,
      f.faculty_id,
      f.faculty_name,
      cm.course_code,
      cm.course_name,
      fa.section_name,
      fa.batch,
      sm.semester_name,
      ay.year_name,
      s.submission_id,
      cmp.component_name,
      s.status,
      s.submitted_at,
      fm.file_id,
      fm.file_name,
      fm.version,
      fm.s3_object_key        AS r2_object_key
    FROM public.faculty_assignment fa
    JOIN  public.faculty          f   ON fa.faculty_id   = f.faculty_id
    JOIN  public.course_offering  co  ON fa.offering_id  = co.offering_id
    JOIN  public.course_master    cm  ON co.course_id    = cm.course_id
    JOIN  public.semester_master  sm  ON co.semester_id  = sm.semester_id
    JOIN  public.academic_year    ay  ON sm.year_id      = ay.year_id
    LEFT JOIN public.submission        s   ON s.faculty_assignment_id = fa.id
    LEFT JOIN public.course_component  cc  ON s.course_component_id  = cc.id
    LEFT JOIN public.component_master  cmp ON cc.component_id        = cmp.component_id
    LEFT JOIN public.file_metadata     fm  ON fm.submission_id       = s.submission_id
    ${whereClause}
    ORDER BY f.faculty_name, cm.course_code, fa.section_name, cmp.component_name, fm.uploaded_at ASC
  `;

  const rows = await queryDb<
    Omit<AuditFacultySubmission, "file_url"> & { r2_object_key: string | null }
  >(query, scoped ? [params!.facultyId!] : []);

  const baseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

  return rows.map((row) => ({
    ...row,
    file_url: row.r2_object_key ? `${baseUrl}/${row.r2_object_key}` : null,
  })) as AuditFacultySubmission[];
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
