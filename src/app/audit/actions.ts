"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteFromR2 } from "@/lib/r2";

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

export type AuditCourseOffering = {
  offering_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  semester_name: string;
  year_name: string;
  is_active: boolean;
};

export type AuditComponentItem = {
  course_component_id: string;
  offering_id: string;
  component_id: string;
  component_name: string;
  mandatory: boolean;
  deadline: string | null;
  report_id: string | null;
  report_status: string | null;
  remarks: string | null;
  file_name: string | null;
  file_url: string | null;
  r2_file_key: string | null;
  file_size: number | null;
  submitted_at: string | null;
  updated_at: string | null;
  auditor_name: string | null;
};

export async function getAuditCourses(params?: {
  facultyId?: number;
  isAdmin?: boolean;
}): Promise<AuditCourseOffering[]> {
  const scoped = !params?.isAdmin && params?.facultyId != null;
  const whereClause = scoped
    ? `WHERE co.offering_id IN (
         SELECT offering_id FROM public.audit_assignment WHERE faculty_id = $1
       )`
    : "";

  const query = `
    SELECT DISTINCT
      co.offering_id,
      cm.course_code,
      cm.course_name,
      cm.credits,
      sm.semester_name,
      ay.year_name,
      sm.is_active
    FROM public.course_offering co
    JOIN public.course_master cm ON co.course_id = cm.course_id
    JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    JOIN public.academic_year ay ON sm.year_id = ay.year_id
    ${whereClause}
    ORDER BY sm.is_active DESC, ay.year_name DESC, cm.course_code ASC
  `;

  return queryDb<AuditCourseOffering>(query, scoped ? [params!.facultyId!] : []);
}

export async function getAuditOfferingComponents(
  offeringId: string,
  auditorFacultyId?: number
): Promise<AuditComponentItem[]> {
  const scoped = auditorFacultyId != null;
  const query = `
    SELECT
      cc.id AS course_component_id,
      cc.offering_id,
      cmp.component_id,
      cmp.component_name,
      cc.mandatory,
      cc.deadline,
      acr.report_id,
      acr.status AS report_status,
      acr.remarks,
      acr.file_name,
      acr.r2_file_key,
      acr.file_size,
      acr.submitted_at,
      acr.updated_at,
      f.faculty_name AS auditor_name
    FROM public.course_component cc
    JOIN public.component_master cmp ON cc.component_id = cmp.component_id
    LEFT JOIN public.audit_component_report acr
      ON acr.course_component_id = cc.id
      AND acr.offering_id = cc.offering_id
      ${scoped ? `AND acr.auditor_faculty_id = $2` : ``}
    LEFT JOIN public.faculty f ON acr.auditor_faculty_id = f.faculty_id
    WHERE cc.offering_id = $1
    ORDER BY cmp.component_name ASC
  `;

  const rows = await queryDb<
    Omit<AuditComponentItem, "file_url"> & { r2_file_key: string | null }
  >(query, scoped ? [offeringId, auditorFacultyId!] : [offeringId]);

  const baseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

  return rows.map((row) => ({
    ...row,
    file_url: row.r2_file_key ? `${baseUrl}/${row.r2_file_key}` : null,
  }));
}

export async function submitAuditComponentReportAction(data: {
  offering_id: string;
  course_component_id: string;
  auditor_faculty_id: number;
  file_name: string;
  r2_file_key: string;
  file_size: number;
  remarks?: string;
}) {
  if (data.file_size > 3 * 1024 * 1024) {
    throw new Error("Report file size exceeds the 3MB limit.");
  }

  await queryDb(
    `
    INSERT INTO public.audit_component_report (
      offering_id,
      course_component_id,
      auditor_faculty_id,
      status,
      remarks,
      file_name,
      r2_file_key,
      file_size,
      submitted_at,
      updated_at
    ) VALUES ($1, $2, $3, 'submitted', $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (offering_id, course_component_id, auditor_faculty_id)
    DO UPDATE SET
      status = 'submitted',
      remarks = EXCLUDED.remarks,
      file_name = EXCLUDED.file_name,
      r2_file_key = EXCLUDED.r2_file_key,
      file_size = EXCLUDED.file_size,
      updated_at = NOW()
    `,
    [
      data.offering_id,
      data.course_component_id,
      data.auditor_faculty_id,
      data.remarks?.trim() || null,
      data.file_name,
      data.r2_file_key,
      data.file_size,
    ]
  );

  revalidatePath("/audit");
  return { ok: true };
}

export async function deleteAuditComponentReportAction(
  report_id: string,
  r2_file_key?: string | null
) {
  await executeDb(
    `DELETE FROM public.audit_component_report WHERE report_id = $1`,
    [report_id]
  );

  if (r2_file_key && !r2_file_key.startsWith("dev/")) {
    try {
      await deleteFromR2(r2_file_key);
    } catch (e) {
      console.warn("Failed to delete audit report file from R2:", e);
    }
  }

  revalidatePath("/audit");
  return { ok: true };
}
