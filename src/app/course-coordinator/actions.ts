"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { buildR2Key, uploadPdfToR2 } from "@/lib/r2";

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
};

export type Component = {
  id: string;
  component_id: string;
  component_name: string;
  deadline: string | null;
  mandatory: boolean;
  offering_id: string;
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
  return queryDb<CoordinatorOffering>(`
    WITH offering_ids AS (
      SELECT ca.offering_id
      FROM public.coordinator_assignment ca
      WHERE ca.faculty_id = $1
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
      fa.student_count
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
      cc.offering_id
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
  return queryDb<{ faculty_id: number; faculty_name: string; designation: string; role: string }>(
    "SELECT faculty_id, faculty_name, designation, role FROM public.faculty WHERE role != 'admin' ORDER BY faculty_name"
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
}

export async function updateFacultyAssignment(data: {
  id: string;
  offering_id: string;
  section_id: string;
  student_count: number;
}) {
  await executeDb(
    `UPDATE public.faculty_assignment
     SET section_id = $1, student_count = $2
     WHERE id = $3 AND offering_id = $4`,
    [data.section_id, data.student_count, data.id, data.offering_id]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
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
}

export async function addCourseComponent(data: {
  offering_id: string;
  component_id: string;
  deadline: string | null;
  mandatory: boolean;
}) {
  const rows = await queryDb<{ id: string }>(
    `INSERT INTO public.course_component (offering_id, component_id, deadline, mandatory)
     VALUES ($1, $2, $3, $4) ON CONFLICT (offering_id, component_id) DO NOTHING RETURNING id`,
    [data.offering_id, data.component_id, data.deadline, data.mandatory]
  );

  const comp_id = rows[0]?.id;
  if (!comp_id) throw new Error("Component already added to this offering.");

  const assignments = await getFacultyAssignments(data.offering_id);
  for (const fa of assignments) {
    await executeDb(
      `INSERT INTO public.submission (faculty_assignment_id, course_component_id, status)
       VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`,
      [fa.id, comp_id]
    );
  }

  revalidatePath(`/course-coordinator/${data.offering_id}`);
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
}

export async function deleteCourseComponent(data: {
  id: string;
  offering_id: string;
}) {
  await executeDb(
    `DELETE FROM public.course_component
     WHERE id = $1 AND offering_id = $2`,
    [data.id, data.offering_id]
  );
  revalidatePath(`/course-coordinator/${data.offering_id}`);
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
  revalidatePath("/course-coordinator");
}
