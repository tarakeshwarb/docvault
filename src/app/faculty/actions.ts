"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteFromR2 } from "@/lib/r2";

export type FacultyCourse = {
  assignment_id: string;
  offering_id: string;
  course_code: string;
  course_name: string;
  section_name: string;
  semester_name: string;
  year_name: string;
  student_count: number;
};

export type PendingSubmission = {
  submission_id: string;
  faculty_assignment_id: string;
  course_component_id: string;
  component_name: string;
  status: string;
  submitted_at: string | null;
  deadline: string | null;
  mandatory: boolean;
  offering_id: string;
  course_name: string;
  course_code: string;
  section_name: string;
};

export async function getFacultyCourses(faculty_id: number): Promise<FacultyCourse[]> {
  return queryDb<FacultyCourse>(`
    SELECT
      fa.id AS assignment_id,
      fa.offering_id,
      cm.course_code,
      cm.course_name,
      sec.section_name,
      sm.semester_name,
      ay.year_name,
      fa.student_count
    FROM public.faculty_assignment fa
    JOIN public.course_offering co ON fa.offering_id = co.offering_id
    JOIN public.course_master cm ON co.course_id = cm.course_id
    JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    JOIN public.academic_year ay ON sm.year_id = ay.year_id
    JOIN public.section_master sec ON fa.section_id = sec.section_id
    WHERE fa.faculty_id = $1 AND sm.is_active = true
    ORDER BY ay.start_date DESC, sm.semester_name, cm.course_code
  `, [faculty_id]);
}

export async function getFacultySubmissions(faculty_id: number): Promise<PendingSubmission[]> {
  return queryDb<PendingSubmission>(`
    SELECT
      s.submission_id,
      s.faculty_assignment_id,
      s.course_component_id,
      cmp.component_name,
      s.status,
      s.submitted_at,
      cc.deadline,
      cc.mandatory,
      fa.offering_id,
      cm.course_name,
      cm.course_code,
      sec.section_name
    FROM public.submission s
    JOIN public.faculty_assignment fa ON s.faculty_assignment_id = fa.id
    JOIN public.course_component cc ON s.course_component_id = cc.id
    JOIN public.component_master cmp ON cc.component_id = cmp.component_id
    JOIN public.course_offering co ON fa.offering_id = co.offering_id
    JOIN public.course_master cm ON co.course_id = cm.course_id
    JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    JOIN public.section_master sec ON fa.section_id = sec.section_id
    WHERE fa.faculty_id = $1 AND sm.is_active = true
    ORDER BY cm.course_code, sec.section_name, cmp.component_name
  `, [faculty_id]);
}

export async function recordFileUpload(data: {
  submission_id: string;
  file_name: string;
  r2_object_key: string;
  file_size: number;
}) {
  const versions = await queryDb<{ version: number }>(
    "SELECT COALESCE(MAX(version), 0) AS version FROM public.file_metadata WHERE submission_id = $1",
    [data.submission_id]
  );
  const nextVersion = (versions[0]?.version ?? 0) + 1;

  await executeDb(
    `INSERT INTO public.file_metadata (submission_id, file_name, s3_object_key, file_size, version)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.submission_id, data.file_name, data.r2_object_key, data.file_size, nextVersion]
  );

  await executeDb(
    "UPDATE public.submission SET status = 'submitted', submitted_at = now() WHERE submission_id = $1",
    [data.submission_id]
  );

  revalidatePath("/faculty");
}

export type FileMetadata = {
  file_id: string;
  submission_id: string;
  file_name: string;
  s3_object_key: string;
  file_size: number;
  uploaded_at: string;
  version: number;
};

export async function getSubmissionFiles(submission_id: string): Promise<FileMetadata[]> {
  return queryDb<FileMetadata>(
    "SELECT * FROM public.file_metadata WHERE submission_id = $1 ORDER BY uploaded_at ASC",
    [submission_id]
  );
}

export async function deleteFileAction(file_id: string, submission_id: string, s3_object_key: string) {
  // 1. Delete from R2
  try {
    await deleteFromR2(s3_object_key);
  } catch (err) {
    console.error("Failed to delete from R2:", err);
    // Proceed to delete from DB anyway to avoid zombie records blocking the UI if R2 fails
  }

  // 2. Delete from database
  await executeDb("DELETE FROM public.file_metadata WHERE file_id = $1", [file_id]);

  // 3. Check if any files are left
  const remaining = await queryDb<{ count: number }>(
    "SELECT COUNT(*) as count FROM public.file_metadata WHERE submission_id = $1",
    [submission_id]
  );

  if (Number(remaining[0]?.count) === 0) {
    // 4. If no files left, revert submission status to pending
    await executeDb(
      "UPDATE public.submission SET status = 'pending', submitted_at = NULL WHERE submission_id = $1",
      [submission_id]
    );
  }

  revalidatePath("/faculty");
}

export type FacultyCourseBroadcast = {
  broadcast_id: string;
  offering_id: string;
  title: string;
  r2_file_key: string;
  file_name: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: string;
};

export async function getFacultyBroadcasts(faculty_id: number): Promise<FacultyCourseBroadcast[]> {
  return queryDb<FacultyCourseBroadcast>(`
    SELECT DISTINCT
      cb.broadcast_id,
      cb.offering_id,
      cb.title,
      cb.r2_file_key,
      cb.file_name,
      cb.uploaded_by,
      f.faculty_name AS uploaded_by_name,
      cb.created_at
    FROM public.course_broadcast cb
    JOIN public.faculty_assignment fa ON cb.offering_id = fa.offering_id
    LEFT JOIN public.faculty f ON cb.uploaded_by = f.faculty_id
    WHERE fa.faculty_id = $1
    ORDER BY cb.created_at DESC
  `, [faculty_id]);
}

