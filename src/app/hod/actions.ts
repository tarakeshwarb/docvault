"use server";

import { queryDb } from "@/lib/db";



export type HodDeptStats = {
  total_courses: number;
  total_faculty: number;
  total_submissions: number;
  submitted_count: number;
  pending_count: number;
  overall_completion_pct: number;
};



export async function getHodDeptStats(): Promise<HodDeptStats> {
  const rows = await queryDb<HodDeptStats>(`
    SELECT
      COUNT(DISTINCT co.offering_id)::int AS total_courses,
      COUNT(DISTINCT fa.faculty_id)::int AS total_faculty,
      COUNT(s.submission_id)::int AS total_submissions,
      COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)::int AS submitted_count,
      COUNT(CASE WHEN s.status = 'pending' THEN 1 END)::int AS pending_count,
      CASE
        WHEN COUNT(s.submission_id) = 0 THEN 0
        ELSE ROUND(COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) * 100.0 / COUNT(s.submission_id))::int
      END AS overall_completion_pct
    FROM public.course_offering co
    JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    LEFT JOIN public.faculty_assignment fa ON fa.offering_id = co.offering_id
    LEFT JOIN public.submission s ON s.faculty_assignment_id = fa.id
    WHERE sm.is_active = true
  `);
  return rows[0] ?? {
    total_courses: 0,
    total_faculty: 0,
    total_submissions: 0,
    submitted_count: 0,
    pending_count: 0,
    overall_completion_pct: 0,
  };
}

export type HodDetailedSubmission = {
  offering_id: string;
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

export async function getHodDetailedData(): Promise<HodDetailedSubmission[]> {
  const query = `
    SELECT
      co.offering_id,
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
    FROM public.course_offering co
    JOIN  public.course_master    cm  ON co.course_id    = cm.course_id
    JOIN  public.semester_master  sm  ON co.semester_id  = sm.semester_id
    JOIN  public.academic_year    ay  ON sm.year_id      = ay.year_id
    JOIN public.faculty_assignment fa ON fa.offering_id = co.offering_id
    JOIN  public.faculty          f   ON fa.faculty_id   = f.faculty_id
    LEFT JOIN public.submission        s   ON s.faculty_assignment_id = fa.id
    LEFT JOIN public.course_component  cc  ON s.course_component_id  = cc.id
    LEFT JOIN public.component_master  cmp ON cc.component_id        = cmp.component_id
    LEFT JOIN public.file_metadata     fm  ON fm.submission_id       = s.submission_id
    WHERE sm.is_active = true
    ORDER BY cm.course_code, f.faculty_name, fa.section_name, cmp.component_name, fm.uploaded_at ASC
  `;

  const rows = await queryDb<
    Omit<HodDetailedSubmission, "file_url"> & { r2_object_key: string | null }
  >(query);

  const baseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

  return rows.map((row) => ({
    ...row,
    file_url: row.r2_object_key ? `${baseUrl}/${row.r2_object_key}` : null,
  })) as HodDetailedSubmission[];
}
