"use server";

import { queryDb } from "@/lib/db";

export type HodCourseOverview = {
  offering_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  semester_name: string;
  year_name: string;
  coordinator_name: string | null;
  total_faculty: number;
  total_submissions: number;
  submitted_count: number;
  pending_count: number;
  completion_pct: number;
};

export type HodFacultySummary = {
  faculty_id: number;
  faculty_name: string;
  designation: string;
  email: string;
  role: string;
  total_assigned: number;
  submitted_count: number;
  pending_count: number;
};

export type HodDeptStats = {
  total_courses: number;
  total_faculty: number;
  total_submissions: number;
  submitted_count: number;
  pending_count: number;
  overall_completion_pct: number;
};

export async function getHodCourseOverview(): Promise<HodCourseOverview[]> {
  return queryDb<HodCourseOverview>(`
    SELECT
      co.offering_id,
      cm.course_code,
      cm.course_name,
      cm.credits,
      sm.semester_name,
      ay.year_name,
      f.faculty_name AS coordinator_name,
      COUNT(DISTINCT fa.id)::int AS total_faculty,
      COUNT(s.submission_id)::int AS total_submissions,
      COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)::int AS submitted_count,
      COUNT(CASE WHEN s.status = 'pending' THEN 1 END)::int AS pending_count,
      CASE
        WHEN COUNT(s.submission_id) = 0 THEN 0
        ELSE ROUND(COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) * 100.0 / COUNT(s.submission_id))::int
      END AS completion_pct
    FROM public.course_offering co
    JOIN public.course_master cm ON co.course_id = cm.course_id
    JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    JOIN public.academic_year ay ON sm.year_id = ay.year_id
    LEFT JOIN public.coordinator_assignment ca ON ca.offering_id = co.offering_id
    LEFT JOIN public.faculty f ON ca.faculty_id = f.faculty_id
    LEFT JOIN public.faculty_assignment fa ON fa.offering_id = co.offering_id
    LEFT JOIN public.submission s ON s.faculty_assignment_id = fa.id
    WHERE sm.is_active = true
    GROUP BY co.offering_id, cm.course_code, cm.course_name, cm.credits,
             sm.semester_name, ay.year_name, f.faculty_name
    ORDER BY cm.course_code
  `);
}

export async function getHodFacultySummary(): Promise<HodFacultySummary[]> {
  return queryDb<HodFacultySummary>(`
    SELECT
      f.faculty_id,
      f.faculty_name,
      f.designation,
      f.email,
      f.role,
      COUNT(s.submission_id)::int AS total_assigned,
      COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)::int AS submitted_count,
      COUNT(CASE WHEN s.status = 'pending' THEN 1 END)::int AS pending_count
    FROM public.faculty f
    LEFT JOIN public.faculty_assignment fa ON fa.faculty_id = f.faculty_id
    LEFT JOIN public.submission s ON s.faculty_assignment_id = fa.id
    LEFT JOIN public.course_offering co ON fa.offering_id = co.offering_id
    LEFT JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    WHERE f.role = 'faculty' AND (sm.is_active = true OR sm.is_active IS NULL)
    GROUP BY f.faculty_id, f.faculty_name, f.designation, f.email, f.role
    ORDER BY f.faculty_name
  `);
}

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
