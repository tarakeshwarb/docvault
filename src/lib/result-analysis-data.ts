/**
 * Server-only data access for the Result Analysis feature.
 * Assembles ResultAnalysisInput objects (for the generators) from the DB and
 * upserts faculty-entered figures. Imported by the faculty server actions and
 * the /api/result-analysis route — never by client components (it uses pg).
 */
import { queryDb, executeDb } from "./db";
import { RANGE_COUNT, type ResultAnalysisInput } from "./result-analysis";

const DEFAULT_DEPT = "CTECH";

export type SavedAnalysis = {
  total_strength: number;
  total_absentees: number;
  ranges: number[];
  exists: boolean;
  student_count: number;
  component_name: string;
  course_code: string;
  course_name: string;
  section_name: string;
};

type SectionRow = {
  faculty_assignment_id: string;
  student_count: number;
  faculty_name: string;
  designation: string | null;
  course_code: string;
  course_name: string;
  section_name: string;
  semester_name: string;
  year_name: string;
  component_name: string;
  total_strength: number | null;
  total_absentees: number | null;
  range_0_49: number | null;
  range_50_59: number | null;
  range_60_69: number | null;
  range_70_79: number | null;
  range_80_89: number | null;
  range_90_100: number | null;
};

const SECTION_SELECT = `
  fa.id AS faculty_assignment_id,
  f.faculty_name,
  f.designation,
  cm.course_code,
  cm.course_name,
  fa.section_name,
  sm.semester_name,
  ay.year_name,
  cmp.component_name,
  ra.total_strength, ra.total_absentees,
  ra.range_0_49, ra.range_50_59, ra.range_60_69,
  ra.range_70_79, ra.range_80_89, ra.range_90_100
`;

const SECTION_JOINS = `
  FROM public.faculty_assignment fa
  JOIN public.course_offering co ON fa.offering_id = co.offering_id
  JOIN public.course_master cm ON co.course_id = cm.course_id
  JOIN public.semester_master sm ON co.semester_id = sm.semester_id
  JOIN public.academic_year ay ON sm.year_id = ay.year_id
  JOIN public.faculty f ON fa.faculty_id = f.faculty_id
  JOIN public.component_master cmp ON cmp.component_id = $2
  LEFT JOIN public.result_analysis ra
    ON ra.faculty_assignment_id = fa.id AND ra.component_id = $2
`;

function rowRanges(r: SectionRow): number[] {
  return [
    r.range_0_49, r.range_50_59, r.range_60_69,
    r.range_70_79, r.range_80_89, r.range_90_100,
  ].map((n) => Number(n ?? 0));
}

function rowToInput(r: SectionRow): ResultAnalysisInput {
  return {
    courseCode: r.course_code,
    courseName: r.course_name,
    component: r.component_name,
    academicYear: `${r.year_name} ${(r.semester_name ?? "").toUpperCase()}`.trim(),
    staffName: r.faculty_name,
    dept: DEFAULT_DEPT,
    specialization: "-",
    yearSection: r.section_name,
    semester: r.semester_name ?? "",
    totalStrength: Number(r.total_strength ?? r.student_count ?? 0),
    totalAbsentees: Number(r.total_absentees ?? 0),
    ranges: rowRanges(r),
  };
}

/** Existing figures for one (section, component), with sensible defaults if unsaved. */
export async function getSavedAnalysis(
  faculty_assignment_id: string,
  component_id: string
): Promise<SavedAnalysis | null> {
  const rows = await queryDb<SectionRow>(
    `SELECT ${SECTION_SELECT} ${SECTION_JOINS} WHERE fa.id = $1`,
    [faculty_assignment_id, component_id]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    total_strength: Number(r.total_strength ?? r.student_count ?? 0),
    total_absentees: Number(r.total_absentees ?? 0),
    ranges: rowRanges(r),
    exists: r.total_strength !== null,
    student_count: Number(r.student_count ?? 0),
    component_name: r.component_name,
    course_code: r.course_code,
    course_name: r.course_name,
    section_name: r.section_name,
  };
}

/** Insert or update the figures for one (section, component). */
export async function upsertAnalysis(data: {
  offering_id: string;
  faculty_assignment_id: string;
  component_id: string;
  total_strength: number;
  total_absentees: number;
  ranges: number[];
}): Promise<void> {
  const r = new Array(RANGE_COUNT)
    .fill(0)
    .map((_, i) => Math.max(0, Math.floor(Number(data.ranges?.[i] ?? 0))));
  await executeDb(
    `INSERT INTO public.result_analysis
       (offering_id, faculty_assignment_id, component_id,
        total_strength, total_absentees,
        range_0_49, range_50_59, range_60_69, range_70_79, range_80_89, range_90_100)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (faculty_assignment_id, component_id) DO UPDATE SET
       total_strength = EXCLUDED.total_strength,
       total_absentees = EXCLUDED.total_absentees,
       range_0_49 = EXCLUDED.range_0_49,
       range_50_59 = EXCLUDED.range_50_59,
       range_60_69 = EXCLUDED.range_60_69,
       range_70_79 = EXCLUDED.range_70_79,
       range_80_89 = EXCLUDED.range_80_89,
       range_90_100 = EXCLUDED.range_90_100,
       updated_at = now()`,
    [
      data.offering_id, data.faculty_assignment_id, data.component_id,
      Math.max(0, Math.floor(data.total_strength)), Math.max(0, Math.floor(data.total_absentees)),
      r[0], r[1], r[2], r[3], r[4], r[5],
    ]
  );
}

/** Create a component (if new) and attach it to the offering; returns it. */
export async function createOfferingComponent(
  offering_id: string,
  name: string
): Promise<{ component_id: string; component_name: string }> {
  const clean = name.trim();
  if (!clean) throw new Error("Component name is required.");
  const rows = await queryDb<{ component_id: string }>(
    `INSERT INTO public.component_master (component_name) VALUES ($1)
     ON CONFLICT (component_name) DO UPDATE SET component_name = EXCLUDED.component_name
     RETURNING component_id`,
    [clean]
  );
  const component_id = rows[0].component_id;
  await executeDb(
    `INSERT INTO public.course_component (offering_id, component_id)
     VALUES ($1, $2) ON CONFLICT (offering_id, component_id) DO NOTHING`,
    [offering_id, component_id]
  );
  return { component_id, component_name: clean };
}

/** Components available for an offering (for the faculty to pick). */
export async function getComponentsForOffering(
  offering_id: string
): Promise<Array<{ component_id: string; component_name: string }>> {
  return queryDb<{ component_id: string; component_name: string }>(
    `SELECT cmp.component_id, cmp.component_name
     FROM public.course_component cc
     JOIN public.component_master cmp ON cc.component_id = cmp.component_id
     WHERE cc.offering_id = $1
     ORDER BY cmp.component_name`,
    [offering_id]
  );
}

/** One section's input for the generators (uses saved figures). */
export async function buildSectionInput(
  faculty_assignment_id: string,
  component_id: string
): Promise<ResultAnalysisInput | null> {
  const rows = await queryDb<SectionRow>(
    `SELECT ${SECTION_SELECT} ${SECTION_JOINS} WHERE fa.id = $1`,
    [faculty_assignment_id, component_id]
  );
  return rows[0] ? rowToInput(rows[0]) : null;
}

/** Components that have at least one saved analysis for this offering. */
export async function getComponentsWithAnalysis(
  offering_id: string
): Promise<Array<{ component_id: string; component_name: string }>> {
  return queryDb<{ component_id: string; component_name: string }>(
    `SELECT DISTINCT cmp.component_id, cmp.component_name
     FROM public.result_analysis ra
     JOIN public.component_master cmp ON ra.component_id = cmp.component_id
     WHERE ra.offering_id = $1
     ORDER BY cmp.component_name`,
    [offering_id]
  );
}

/** All sections (with saved data) for an offering+component, for the consolidated report. */
export async function buildConsolidatedInputs(
  offering_id: string,
  component_id: string
): Promise<ResultAnalysisInput[]> {
  const rows = await queryDb<SectionRow>(
    `SELECT ${SECTION_SELECT} ${SECTION_JOINS}
     WHERE fa.offering_id = $1 AND ra.total_strength IS NOT NULL
     ORDER BY fa.section_name`,
    [offering_id, component_id]
  );
  return rows.map(rowToInput);
}

export type SavedAnalysisSummary = {
  component_id: string;
  component_name: string;
  section_name: string;
  faculty_assignment_id: string;
  total_strength: number;
  total_absentees: number;
  ranges: number[];
  pass_pct: number;
  updated_at: string | null;
};

/** All saved result_analysis rows for a given faculty+offering, across all components. */
export async function getAllSavedAnalysesForFaculty(
  faculty_assignment_id: string
): Promise<SavedAnalysisSummary[]> {
  const rows = await queryDb<{
    component_id: string;
    component_name: string;
    section_name: string;
    faculty_assignment_id: string;
    total_strength: number;
    total_absentees: number;
    range_0_49: number;
    range_50_59: number;
    range_60_69: number;
    range_70_79: number;
    range_80_89: number;
    range_90_100: number;
    updated_at: string | null;
  }>(
    `SELECT
       ra.component_id,
       cmp.component_name,
       fa.section_name,
       ra.faculty_assignment_id,
       ra.total_strength,
       ra.total_absentees,
       ra.range_0_49, ra.range_50_59, ra.range_60_69,
       ra.range_70_79, ra.range_80_89, ra.range_90_100,
       ra.updated_at::text
     FROM public.result_analysis ra
     JOIN public.component_master cmp ON cmp.component_id = ra.component_id
     JOIN public.faculty_assignment fa ON fa.id = ra.faculty_assignment_id
     WHERE ra.faculty_assignment_id = $1
     ORDER BY cmp.component_name, fa.section_name`,
    [faculty_assignment_id]
  );

  return rows.map((r) => {
    const ranges = [
      Number(r.range_0_49 ?? 0),
      Number(r.range_50_59 ?? 0),
      Number(r.range_60_69 ?? 0),
      Number(r.range_70_79 ?? 0),
      Number(r.range_80_89 ?? 0),
      Number(r.range_90_100 ?? 0),
    ];
    const strength = Number(r.total_strength ?? 0);
    const absentees = Number(r.total_absentees ?? 0);
    const failures = ranges[0];
    const present = strength - absentees;
    const pass_pct = strength > 0 ? ((present - failures) / strength) * 100 : 0;
    return {
      component_id: r.component_id,
      component_name: r.component_name,
      section_name: r.section_name,
      faculty_assignment_id: r.faculty_assignment_id,
      total_strength: strength,
      total_absentees: absentees,
      ranges,
      pass_pct,
      updated_at: r.updated_at,
    };
  });
}
