"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { buildR2Key, uploadPdfToR2, deleteFromR2 } from "@/lib/r2";
import * as ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sendEmail } from "@/lib/mailer";

export type CoordinatorOffering = {
  offering_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  semester_name: string;
  year_name: string;
};

export type FacultyAssignment = {
  id: string;
  faculty_id: number;
  faculty_name: string;
  designation: string;
  email: string;
  section_id: string;
  section_name: string;
  student_count: number;
  last_reminder_sent_at: string | null;
  daily_reminder_count: number;
};

export type Component = {
  id: string;
  component_id: string;
  component_name: string;
  deadline: string | null;
  mandatory: boolean;
  offering_id: string;
  is_common: boolean;
  common_file_key: string | null;
  common_file_name: string | null;
};

export type ComponentMaster = {
  component_id: string;
  component_name: string;
};

export type Section = {
  section_id: string;
  section_name: string;
};

export type SubmissionStatus = {
  submission_id: string | null;
  faculty_assignment_id: string;
  faculty_name: string;
  section_name: string;
  course_component_id: string;
  component_name: string;
  status: string;
  submitted_at: string | null;
  deadline: string | null;
};

export type GeneratedReport = {
  report_id: string;
  report_type: string;
  generated_at: string;
  r2_report_path: string;
  generated_by_name: string | null;
};

export type GeneratedReportListItem = GeneratedReport;

type OfferingSummary = {
  offering_id: string;
  course_code: string;
  course_name: string;
  semester_name: string;
  year_name: string;
};

export async function getCoordinatorOfferings(faculty_id: number): Promise<CoordinatorOffering[]> {
  try {
    return await queryDb<CoordinatorOffering>(`
      WITH offering_ids AS (
        SELECT ca.offering_id
        FROM public.coordinator_assignment ca
        WHERE ca.faculty_id = $1
        UNION
        SELECT sca.offering_id
        FROM public.secondary_coordinator_assignment sca
        WHERE sca.faculty_id = $1
      )
      SELECT DISTINCT
        co.offering_id,
        cm.course_code,
        cm.course_name,
        cm.credits,
        sm.semester_name,
        ay.year_name,
        ay.start_date
      FROM offering_ids oi
      JOIN public.course_offering co ON oi.offering_id = co.offering_id
      JOIN public.course_master cm ON co.course_id = cm.course_id
      JOIN public.semester_master sm ON co.semester_id = sm.semester_id
      JOIN public.academic_year ay ON sm.year_id = ay.year_id
      WHERE sm.is_active = true
      ORDER BY ay.start_date DESC, sm.semester_name, cm.course_code
    `, [faculty_id]);
  } catch (error) {
    // Fallback to query without secondary_coordinator_assignment if table doesn't exist
    console.warn("secondary_coordinator_assignment table not found, using fallback query");
    return queryDb<CoordinatorOffering>(`
      SELECT DISTINCT
        co.offering_id,
        cm.course_code,
        cm.course_name,
        cm.credits,
        sm.semester_name,
        ay.year_name,
        ay.start_date
      FROM public.coordinator_assignment ca
      JOIN public.course_offering co ON ca.offering_id = co.offering_id
      JOIN public.course_master cm ON co.course_id = cm.course_id
      JOIN public.semester_master sm ON co.semester_id = sm.semester_id
      JOIN public.academic_year ay ON sm.year_id = ay.year_id
      WHERE ca.faculty_id = $1 AND sm.is_active = true
      ORDER BY ay.start_date DESC, sm.semester_name, cm.course_code
    `, [faculty_id]);
  }
}

export async function getFacultyAssignments(offering_id: string): Promise<FacultyAssignment[]> {
  return queryDb<FacultyAssignment>(`
    SELECT
      fa.id,
      fa.faculty_id,
      f.faculty_name,
      f.designation,
      f.email,
      fa.section_id,
      sec.section_name,
      fa.student_count,
      fa.last_reminder_sent_at,
      fa.daily_reminder_count
    FROM public.faculty_assignment fa
    JOIN public.faculty f ON fa.faculty_id = f.faculty_id
    JOIN public.section_master sec ON fa.section_id = sec.section_id
    WHERE fa.offering_id = $1
    ORDER BY sec.section_name, f.faculty_name
  `, [offering_id]);
}

export async function getCourseComponents(offering_id: string): Promise<Component[]> {
  return queryDb<Component>(`
    SELECT
      cc.id,
      cc.component_id,
      cm.component_name,
      cc.deadline,
      cc.mandatory,
      cc.offering_id,
      cc.is_common,
      cc.common_file_key,
      cc.common_file_name
    FROM public.course_component cc
    JOIN public.component_master cm ON cc.component_id = cm.component_id
    WHERE cc.offering_id = $1
    ORDER BY cm.component_name
  `, [offering_id]);
}

export async function getComponentMasters(): Promise<ComponentMaster[]> {
  return queryDb<ComponentMaster>(
    "SELECT * FROM public.component_master ORDER BY component_name"
  );
}

export async function getAllSections(): Promise<Section[]> {
  return queryDb<Section>("SELECT * FROM public.section_master ORDER BY section_name");
}

export async function getAllFacultyForAssignment() {
  return queryDb<{ faculty_id: number; faculty_name: string; designation: string; role: string; email: string }>(
    "SELECT faculty_id, faculty_name, designation, role, email FROM public.faculty WHERE role != 'admin' ORDER BY faculty_name"
  );
}

export async function getSubmissionStatus(offering_id: string): Promise<SubmissionStatus[]> {
  return queryDb<SubmissionStatus>(`
    SELECT
      s.submission_id,
      s.faculty_assignment_id,
      f.faculty_name,
      sec.section_name,
      s.course_component_id,
      cm.component_name,
      s.status,
      s.submitted_at,
      cc.deadline
    FROM public.submission s
    JOIN public.faculty_assignment fa ON s.faculty_assignment_id = fa.id
    JOIN public.faculty f ON fa.faculty_id = f.faculty_id
    JOIN public.section_master sec ON fa.section_id = sec.section_id
    JOIN public.course_component cc ON s.course_component_id = cc.id
    JOIN public.component_master cm ON cc.component_id = cm.component_id
    WHERE fa.offering_id = $1
    ORDER BY sec.section_name, f.faculty_name, cm.component_name
  `, [offering_id]);
}

export async function getGeneratedReports(offering_id: string): Promise<GeneratedReport[]> {
  return queryDb<GeneratedReport>(`
    SELECT
      gr.report_id,
      gr.report_type,
      gr.generated_at,
      gr.s3_report_path AS r2_report_path,
      f.faculty_name AS generated_by_name
    FROM public.generated_report gr
    LEFT JOIN public.faculty f ON gr.generated_by = f.faculty_id
    WHERE gr.offering_id = $1
    ORDER BY gr.generated_at DESC
  `, [offering_id]);
}

async function getOfferingSummary(offering_id: string): Promise<OfferingSummary | null> {
  const rows = await queryDb<OfferingSummary>(`
    SELECT
      co.offering_id,
      cm.course_code,
      cm.course_name,
      sm.semester_name,
      ay.year_name
    FROM public.course_offering co
    JOIN public.course_master cm ON co.course_id = cm.course_id
    JOIN public.semester_master sm ON co.semester_id = sm.semester_id
    JOIN public.academic_year ay ON sm.year_id = ay.year_id
    WHERE co.offering_id = $1
    LIMIT 1
  `, [offering_id]);

  return rows[0] ?? null;
}

export async function addFacultyAssignment(data: {
  offering_id: string;
  faculty_id: number;
  section_id: string;
  student_count: number;
}) {
  const rows = await queryDb<{ id: string }>(
    `INSERT INTO public.faculty_assignment (offering_id, faculty_id, section_id, student_count)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (offering_id, faculty_id, section_id) DO UPDATE SET student_count = $4
     RETURNING id`,
    [data.offering_id, data.faculty_id, data.section_id, data.student_count]
  );

  const assignment_id = rows[0]?.id;
  if (!assignment_id) throw new Error("Failed to create assignment.");

  const components = await getCourseComponents(data.offering_id);
  for (const comp of components) {
    await executeDb(
      `INSERT INTO public.submission (faculty_assignment_id, course_component_id, status)
       VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`,
      [assignment_id, comp.id]
    );
  }

  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
}

export async function updateFacultyAssignment(data: {
  id: string;
  offering_id: string;
  faculty_id: number;
  section_id: string;
  student_count: number;
}) {
  await executeDb(
    `UPDATE public.faculty_assignment
     SET section_id = $1, student_count = $2, faculty_id = $3
     WHERE id = $4 AND offering_id = $5`,
    [data.section_id, data.student_count, data.faculty_id, data.id, data.offering_id]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
}

export async function deleteFacultyAssignment(data: {
  id: string;
  offering_id: string;
}) {
  await executeDb(
    `DELETE FROM public.submission WHERE faculty_assignment_id = $1`,
    [data.id]
  );
  await executeDb(
    `DELETE FROM public.faculty_assignment WHERE id = $1 AND offering_id = $2`,
    [data.id, data.offering_id]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
}

export async function addCourseComponent(data: {
  offering_id: string;
  component_id: string;
  deadline: string | null;
  mandatory: boolean;
  is_common?: boolean;
}) {
  const isCommon = data.is_common ?? false;
  const rows = await queryDb<{ id: string }>(
    `INSERT INTO public.course_component (offering_id, component_id, deadline, mandatory, is_common)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT (offering_id, component_id) DO NOTHING RETURNING id`,
    [data.offering_id, data.component_id, data.deadline, data.mandatory, isCommon]
  );

  const comp_id = rows[0]?.id;
  if (!comp_id) throw new Error("Component already added to this offering.");

  // Common components have ONE shared file (uploaded by the coordinator), so we
  // do not create a per-faculty submission for them.
  if (!isCommon) {
    const assignments = await getFacultyAssignments(data.offering_id);
    for (const fa of assignments) {
      await executeDb(
        `INSERT INTO public.submission (faculty_assignment_id, course_component_id, status)
         VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`,
        [fa.id, comp_id]
      );
    }
  }

  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
  revalidatePath(`/faculty`);
}

/** Coordinator uploads / replaces the single shared file for a common component. */
export async function setCommonComponentFile(data: {
  course_component_id: string;
  offering_id: string;
  r2_object_key: string;
  file_name: string;
  uploaded_by: number;
}) {
  // Remove the previous file from R2 if one is being replaced.
  const prev = await queryDb<{ common_file_key: string | null }>(
    `SELECT common_file_key FROM public.course_component WHERE id = $1`,
    [data.course_component_id]
  );
  const oldKey = prev[0]?.common_file_key;
  if (oldKey && oldKey !== data.r2_object_key) {
    try {
      await deleteFromR2(oldKey);
    } catch (err) {
      console.error("Failed to delete replaced common file from R2:", err);
    }
  }

  await executeDb(
    `UPDATE public.course_component
     SET common_file_key = $2, common_file_name = $3,
         common_uploaded_by = $4, common_uploaded_at = now()
     WHERE id = $1`,
    [data.course_component_id, data.r2_object_key, data.file_name, data.uploaded_by]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
  revalidatePath(`/faculty`);
}

/** Remove the shared file from a common component. */
export async function removeCommonComponentFile(data: {
  course_component_id: string;
  offering_id: string;
  r2_object_key: string;
}) {
  try {
    await deleteFromR2(data.r2_object_key);
  } catch (err) {
    console.error("Failed to delete common file from R2:", err);
  }
  await executeDb(
    `UPDATE public.course_component
     SET common_file_key = NULL, common_file_name = NULL,
         common_uploaded_by = NULL, common_uploaded_at = NULL
     WHERE id = $1`,
    [data.course_component_id]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
  revalidatePath(`/faculty`);
}

export async function updateCourseComponent(data: {
  id: string;
  offering_id: string;
  deadline: string | null;
  mandatory: boolean;
}) {
  await executeDb(
    `UPDATE public.course_component
     SET deadline = $1, mandatory = $2
     WHERE id = $3 AND offering_id = $4`,
    [data.deadline, data.mandatory, data.id, data.offering_id]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
}

export async function deleteCourseComponent(data: {
  id: string;
  offering_id: string;
}) {
  // Clean up a common file from R2 if this component has one.
  const rows = await queryDb<{ common_file_key: string | null }>(
    `SELECT common_file_key FROM public.course_component WHERE id = $1`,
    [data.id]
  );
  const key = rows[0]?.common_file_key;
  if (key) {
    try {
      await deleteFromR2(key);
    } catch (err) {
      console.error("Failed to delete common file from R2:", err);
    }
  }

  await executeDb(
    `DELETE FROM public.course_component
     WHERE id = $1 AND offering_id = $2`,
    [data.id, data.offering_id]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
  revalidatePath(`/faculty`);
}

export async function createSection(section_name: string): Promise<string> {
  const rows = await queryDb<{ section_id: string }>(
    `INSERT INTO public.section_master (section_name) VALUES ($1)
     ON CONFLICT DO NOTHING RETURNING section_id`,
    [section_name]
  );
  if (rows[0]) return rows[0].section_id;
  const existing = await queryDb<{ section_id: string }>(
    "SELECT section_id FROM public.section_master WHERE section_name = $1",
    [section_name]
  );
  return existing[0]!.section_id;
}

export async function createCustomComponent(component_name: string): Promise<string> {
  const rows = await queryDb<{ component_id: string }>(
    `INSERT INTO public.component_master (component_name) VALUES ($1)
     ON CONFLICT (component_name) DO NOTHING RETURNING component_id`,
    [component_name]
  );
  if (rows[0]) return rows[0].component_id;
  const existing = await queryDb<{ component_id: string }>(
    "SELECT component_id FROM public.component_master WHERE component_name = $1",
    [component_name]
  );
  return existing[0]!.component_id;
}

export async function addFacultyAssignments(data: {
  offering_id: string;
  faculty_id: number;
  section_ids: string[];
  student_count: number;
}) {
  for (const section_id of data.section_ids) {
    await addFacultyAssignment({
      offering_id: data.offering_id,
      faculty_id: data.faculty_id,
      section_id,
      student_count: data.student_count,
    });
  }
}

export async function bulkAddFacultyAssignments(data: {
  offering_id: string;
  assignments: { faculty_id: number; section_id: string; student_count: number }[];
}) {
  for (const a of data.assignments) {
    await addFacultyAssignment({
      offering_id: data.offering_id,
      faculty_id: a.faculty_id,
      section_id: a.section_id,
      student_count: a.student_count,
    });
  }
}

export type ExcelParsedResult = {
  faculty_id: number;
  faculty_name: string;
  email: string;
  section_id?: string;
  section_name?: string;
  student_count?: number;
  error?: string;
};

export async function parseAssignmentExcel(formData: FormData): Promise<ExcelParsedResult[]> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Excel file is empty");

  const results: ExcelParsedResult[] = [];
  const allFaculty = await getAllFacultyForAssignment();
  const allSections = await getAllSections();

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    // Expecting: S.No (1), Faculty ID (2), Faculty Name (3), Email (4), Section (5)
    const rawId = row.getCell(2).text?.trim();
    const rawName = row.getCell(3).text?.trim();
    const rawEmail = row.getCell(4).text?.trim();
    const rawSection = row.getCell(5).text?.trim();

    if (!rawEmail && !rawId) return;

    const facultyMatch = allFaculty.find(f => 
      (rawId && String(f.faculty_id) === rawId) || 
      (rawEmail && f.email?.toLowerCase() === rawEmail.toLowerCase())
    );

    let sectionMatch = undefined;
    if (rawSection) {
      sectionMatch = allSections.find(s => s.section_name.toLowerCase() === rawSection.toLowerCase());
    }

    if (facultyMatch && sectionMatch) {
      results.push({
        faculty_id: facultyMatch.faculty_id,
        faculty_name: facultyMatch.faculty_name,
        email: facultyMatch.email,
        section_id: sectionMatch.section_id,
        section_name: sectionMatch.section_name,
      });
    } else if (!facultyMatch) {
      results.push({
        faculty_id: parseInt(rawId) || 0,
        faculty_name: rawName || "Unknown",
        email: rawEmail || "",
        error: "Faculty not found in system.",
      });
    } else if (!sectionMatch) {
      results.push({
        faculty_id: facultyMatch.faculty_id,
        faculty_name: facultyMatch.faculty_name,
        email: facultyMatch.email,
        section_name: rawSection || "None",
        error: "Section not found.",
      });
    }
  });

  return results;
}

export async function generateConsolidatedReport(formData: FormData) {
  const offering_id = String(formData.get("offering_id") ?? "").trim();
  const report_type = String(formData.get("report_type") ?? "").trim();
  const generated_by = Number(formData.get("generated_by") ?? 0) || null;

  if (!offering_id || !report_type) {
    throw new Error("Offering and report type are required.");
  }

  const [summary, assignments, components, submissions] = await Promise.all([
    getOfferingSummary(offering_id),
    getFacultyAssignments(offering_id),
    getCourseComponents(offering_id),
    getSubmissionStatus(offering_id),
  ]);

  if (!summary) {
    throw new Error("Offering not found.");
  }

  const submitted = submissions.filter((item) => item.status === "submitted").length;
  const pending = submissions.filter((item) => item.status === "pending").length;
  const late = submissions.filter((item) => item.status === "late").length;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = 790;

  const drawLine = (text: string, options?: { bold?: boolean; size?: number; color?: [number, number, number] }) => {
    page.drawText(text, {
      x: margin,
      y,
      size: options?.size ?? 12,
      font: options?.bold ? fontBold : font,
      color: rgb(...(options?.color ?? [0.12, 0.18, 0.28])),
    });
    y -= options?.size ?? 12;
    y -= 8;
  };

  drawLine("CourseFlow Academic Report", { bold: true, size: 20 });
  drawLine(`${summary.course_code} - ${summary.course_name}`, { bold: true, size: 15 });
  drawLine(`${summary.semester_name} Semester | ${summary.year_name}`);
  drawLine(`Report type: ${report_type.replace(/_/g, " ")}`);
  drawLine(`Generated on: ${new Date().toISOString()}`);

  page.drawRectangle({
    x: margin,
    y: y - 10,
    width: 500,
    height: 2,
    color: rgb(0.08, 0.35, 0.82),
  });
  y -= 32;

  drawLine("Summary", { bold: true, size: 14 });
  drawLine(`Faculty assigned: ${assignments.length}`);
  drawLine(`Components required: ${components.length}`);
  drawLine(`Submitted: ${submitted}`);
  drawLine(`Pending: ${pending}`);
  drawLine(`Late: ${late}`);

  drawLine("Sections", { bold: true, size: 14 });
  assignments.slice(0, 12).forEach((assignment) => {
    drawLine(`Section ${assignment.section_name} - ${assignment.faculty_name} (${assignment.student_count} students)`, {
      size: 10.5,
    });
  });

  if (assignments.length > 12) {
    drawLine(`+ ${assignments.length - 12} more sections...`, { size: 10.5 });
  }

  const bytes = await pdf.save();
  const buffer = Buffer.from(bytes);
  const key = buildR2Key(`${summary.course_code}-${report_type}.pdf`);
  const reportUrl = await uploadPdfToR2({
    key,
    body: buffer,
    contentType: "application/pdf",
  });

  await executeDb(
    `INSERT INTO public.generated_report (offering_id, report_type, generated_by, s3_report_path)
     VALUES ($1, $2, $3, $4)`,
    [offering_id, report_type, generated_by, reportUrl]
  );

  revalidatePath(`/course-coordinator/${offering_id}`);
  revalidatePath(`/secondary-coordinator/${offering_id}`);
  revalidatePath("/course-coordinator");
  revalidatePath("/secondary-coordinator");
}

export type CourseBroadcast = {
  broadcast_id: string;
  offering_id: string;
  title: string;
  r2_file_key: string;
  file_name: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: string;
};

export async function getCourseBroadcasts(offering_id: string): Promise<CourseBroadcast[]> {
  return queryDb<CourseBroadcast>(`
    SELECT
      cb.broadcast_id,
      cb.offering_id,
      cb.title,
      cb.r2_file_key,
      cb.file_name,
      cb.uploaded_by,
      f.faculty_name AS uploaded_by_name,
      cb.created_at
    FROM public.course_broadcast cb
    LEFT JOIN public.faculty f ON cb.uploaded_by = f.faculty_id
    WHERE cb.offering_id = $1
    ORDER BY cb.created_at DESC
  `, [offering_id]);
}

export type GlobalCourseBroadcast = CourseBroadcast & {
  course_code: string;
  course_name: string;
};

export async function getAllCourseBroadcasts(): Promise<GlobalCourseBroadcast[]> {
  return queryDb<GlobalCourseBroadcast>(`
    SELECT
      cb.broadcast_id,
      cb.offering_id,
      cb.title,
      cb.r2_file_key,
      cb.file_name,
      cb.uploaded_by,
      f.faculty_name AS uploaded_by_name,
      cb.created_at,
      cm.course_code,
      cm.course_name
    FROM public.course_broadcast cb
    LEFT JOIN public.faculty f ON cb.uploaded_by = f.faculty_id
    JOIN public.course_offering co ON cb.offering_id = co.offering_id
    JOIN public.course_master cm ON co.course_id = cm.course_id
    ORDER BY cb.created_at DESC
  `);
}

export async function addCourseBroadcast(data: {
  offering_id: string;
  title: string;
  r2_file_key: string;
  file_name: string;
  uploaded_by: number;
}) {
  await executeDb(
    `INSERT INTO public.course_broadcast (offering_id, title, r2_file_key, file_name, uploaded_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.offering_id, data.title, data.r2_file_key, data.file_name, data.uploaded_by]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
  revalidatePath(`/secondary-coordinator/${data.offering_id}`);
  revalidatePath(`/faculty`);
}

export async function deleteCourseBroadcast(broadcast_id: string, offering_id: string, r2_file_key: string) {
  try {
    await deleteFromR2(r2_file_key);
  } catch (err) {
    console.error("Failed to delete broadcast file from R2:", err);
  }
  await executeDb(
    `DELETE FROM public.course_broadcast WHERE broadcast_id = $1 AND offering_id = $2`,
    [broadcast_id, offering_id]
  );
  revalidatePath(`/course-coordinator/${offering_id}`);
  revalidatePath(`/secondary-coordinator/${offering_id}`);
  revalidatePath(`/faculty`);
}

/**
 * Approval gate: a coordinator (main or secondary) approves a faculty's
 * submitted document. Only then is it treated as finalised.
 */
export async function approveSubmission(
  submission_id: string,
  approver_id: number,
  offering_id: string
) {
  if (!submission_id) throw new Error("Missing submission.");
  await executeDb(
    `UPDATE public.submission
     SET status = 'approved', approved_by = $2, approved_at = now()
     WHERE submission_id = $1`,
    [submission_id, approver_id]
  );
  revalidatePath(`/course-coordinator/${offering_id}`);
  revalidatePath(`/secondary-coordinator/${offering_id}`);
  revalidatePath(`/faculty`);
}

/** Revert an approval back to 'submitted' (awaiting approval again). */
export async function revokeApproval(submission_id: string, offering_id: string) {
  if (!submission_id) throw new Error("Missing submission.");
  await executeDb(
    `UPDATE public.submission
     SET status = 'submitted', approved_by = NULL, approved_at = NULL
     WHERE submission_id = $1`,
    [submission_id]
  );
  revalidatePath(`/course-coordinator/${offering_id}`);
  revalidatePath(`/secondary-coordinator/${offering_id}`);
  revalidatePath(`/faculty`);
}

export async function sendReminderEmail(offering_id: string, faculty_assignment_id: string) {
  const assignments = await getFacultyAssignments(offering_id);
  const assignment = assignments.find((a) => a.id === faculty_assignment_id);
  
if (!assignment) throw new Error("Faculty assignment not found");
  if (!assignment.email) throw new Error("Faculty has no email address configured");

  let diffHours = 999;
  if (assignment.last_reminder_sent_at) {
    const lastSent = new Date(assignment.last_reminder_sent_at);
    const now = new Date();
    diffHours = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24 && (assignment.daily_reminder_count || 0) >= 2) {
      return { success: false, message: "Rate limit: 2 reminders already sent within the last 24 hours.", skipped: true };
    }
  }

  const components = await getCourseComponents(offering_id);
  const trackedComponents = components.filter((c) => !c.is_common);
  
  const submissions = await getSubmissionStatus(offering_id);
  const facultySubmissions = submissions.filter((s) => s.faculty_assignment_id === faculty_assignment_id);

  const pendingComponents = trackedComponents.filter((comp) => {
    const sub = facultySubmissions.find((s) => s.course_component_id === comp.id);
    return !sub || sub.status === "pending" || sub.status === "late";
  });

  if (pendingComponents.length === 0) {
    return { success: true, message: "No pending components to remind about." };
  }

  const componentNames = pendingComponents.map((c) => {
    const deadlineStr = c.deadline ? new Date(c.deadline).toLocaleDateString() : 'No deadline';
    return `- ${c.component_name} (Deadline: ${deadlineStr})`;
  }).join("<br/>");

  const offeringSummary = await getOfferingSummary(offering_id);
  const courseName = offeringSummary ? offeringSummary.course_name : "your assigned course";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #0c4da2;">Submission Reminder</h2>
      <p>Dear ${assignment.faculty_name},</p>
      <p>This is a gentle reminder that you have pending document submissions for <strong>${courseName}</strong> (Section: ${assignment.section_name}).</p>
      <p>Please submit the following required documents as soon as possible:</p>
      <div style="margin-left: 20px; color: #d32f2f;">
        ${componentNames}
      </div>
      <br/>
      <p>You can upload these documents by logging into the Faculty Portal.</p>
      <p>Thank you,</p>
      <p>Course Coordinator Team</p>
    </div>
  `;

await sendEmail({
    to: assignment.email,
    subject: `Reminder: Pending Submissions for ${courseName}`,
    html,
  });

  if (diffHours < 24) {
    await executeDb(
      `UPDATE public.faculty_assignment SET last_reminder_sent_at = NOW(), daily_reminder_count = COALESCE(daily_reminder_count, 0) + 1 WHERE id = $1`,
      [faculty_assignment_id]
    );
  } else {
    await executeDb(
      `UPDATE public.faculty_assignment SET last_reminder_sent_at = NOW(), daily_reminder_count = 1 WHERE id = $1`,
      [faculty_assignment_id]
    );
  }

  return { success: true, message: "Reminder email sent successfully." };
}


export async function sendRemindersToAllPending(offering_id: string) {
  const assignments = await getFacultyAssignments(offering_id);
  let sentCount = 0;
  let skippedCount = 0;
  for (const assignment of assignments) {
    if (!assignment.email) continue;
    try {
      const res = await sendReminderEmail(offering_id, assignment.id);
      if (res.success && res.message !== "No pending components to remind about.") {
        sentCount++;
      } else if (res.skipped) {
        skippedCount++;
      }
    } catch (err) {
      console.error(`Failed to send to ${assignment.email}`, err);
    }
  }
  let msg = `Sent ${sentCount} reminders successfully.`;
  if (skippedCount > 0) {
    msg += ` (${skippedCount} skipped - already reminded today)`;
  }
  return { success: true, message: msg };
}
