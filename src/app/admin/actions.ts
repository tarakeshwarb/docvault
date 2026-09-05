"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getFacultySession } from "@/lib/auth";
import ExcelJS from "exceljs";

export type Course = {
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  course_type: string | null;
  year_of_study: number | null;
  created_at: string;
};

export type Faculty = {
  faculty_id: number;
  faculty_name: string;
  designation: string;
  email: string;
  mobile_no: string;
  role: string;
  created_at: string;
};

export type CourseOffering = {
  offering_id: string;
  course_id: string;
  semester_id: string;
  course_code: string;
  course_name: string;
  semester_name: string;
  year_name: string;
  primary_coordinator: {
    faculty_id: number | null;
    faculty_name: string | null;
  };
  secondary_coordinators: Array<{
    faculty_id: number;
    faculty_name: string;
  }>;
  audit_professors: Array<{
    faculty_id: number;
    faculty_name: string;
  }>;
};

export async function getCourses(): Promise<Course[]> {
  try {
    const session = await getFacultySession();
    const isDev = session?.email === 'saiishita@gmail.com' || session?.email === 'shizuu1727@gmail.com';
    
    const query = isDev 
      ? "SELECT * FROM public.course_master WHERE course_code LIKE 'DEV%' ORDER BY course_code ASC"
      : "SELECT * FROM public.course_master WHERE course_code NOT LIKE 'DEV%' ORDER BY course_code ASC";

    return await queryDb<Course>(query);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

export async function getCourseById(course_id: string): Promise<Course | null> {
  try {
    const rows = await queryDb<Course>(
      "SELECT * FROM public.course_master WHERE course_id = $1 LIMIT 1",
      [course_id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return null;
  }
}

export async function updateCourse(
  course_id: string,
  data: { course_code: string; course_name: string; credits: number; course_type: string; year_of_study?: number | null }
) {
  await executeDb(
    `UPDATE public.course_master 
     SET course_code = $1, course_name = $2, credits = $3, course_type = $4, year_of_study = $6 
     WHERE course_id = $5`,
    [data.course_code, data.course_name, data.credits, data.course_type, course_id, data.year_of_study || null]
  );
  revalidatePath("/admin/courses");
}

export async function deleteCourse(course_id: string) {
  await executeDb(
    "DELETE FROM public.course_master WHERE course_id = $1",
    [course_id]
  );
  revalidatePath("/admin/courses");
}


export async function getAllFaculty(): Promise<Faculty[]> {
  try {
    return await queryDb<Faculty>(
      "SELECT * FROM public.faculty ORDER BY faculty_name ASC"
    );
  } catch (error) {
    console.error("Failed to fetch faculty:", error);
    return [];
  }
}

export async function getCourseOfferings(): Promise<CourseOffering[]> {
  try {
    const session = await getFacultySession();
    const isDev = session?.email === 'saiishita@gmail.com' || session?.email === 'shizuu1727@gmail.com';
    const devFilter = isDev ? "AND cm.course_code LIKE 'DEV%'" : "AND cm.course_code NOT LIKE 'DEV%'";

    const offerings = await queryDb<{
      offering_id: string;
      course_id: string;
      semester_id: string;
      course_code: string;
      course_name: string;
      semester_name: string;
      year_name: string;
    }>(`
      SELECT
        co.offering_id,
        co.course_id,
        co.semester_id,
        cm.course_code,
        cm.course_name,
        sm.semester_name,
        ay.year_name
      FROM public.course_offering co
      JOIN public.course_master cm ON co.course_id = cm.course_id
      JOIN public.semester_master sm ON co.semester_id = sm.semester_id
      JOIN public.academic_year ay ON sm.year_id = ay.year_id
      WHERE sm.is_active = true ${devFilter}
      ORDER BY ay.start_date DESC, sm.semester_name, cm.course_code
    `);

    if (offerings.length === 0) {
      return [];
    }

    // Fetch primary coordinators for all offerings
    const primaryCoordinators = await queryDb<{
      offering_id: string;
      faculty_id: number;
      faculty_name: string;
    }>(`
      SELECT
        ca.offering_id,
        ca.faculty_id,
        f.faculty_name
      FROM public.coordinator_assignment ca
      JOIN public.faculty f ON ca.faculty_id = f.faculty_id
      WHERE ca.offering_id IN (${offerings.map((_, i) => `$${i + 1}`).join(', ')})
    `, offerings.map(o => o.offering_id));

    // Fetch secondary coordinators for all offerings
    const secondaryCoordinators = await queryDb<{
      offering_id: string;
      faculty_id: number;
      faculty_name: string;
    }>(`
      SELECT
        sca.offering_id,
        sca.faculty_id,
        f.faculty_name
      FROM public.secondary_coordinator_assignment sca
      JOIN public.faculty f ON sca.faculty_id = f.faculty_id
      WHERE sca.offering_id IN (${offerings.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY sca.offering_id, sca.created_at
    `, offerings.map(o => o.offering_id));

    // Fetch audit professors for all offerings
    const auditProfessors = await queryDb<{
      offering_id: string;
      faculty_id: number;
      faculty_name: string;
    }>(`
      SELECT
        aa.offering_id,
        aa.faculty_id,
        f.faculty_name
      FROM public.audit_assignment aa
      JOIN public.faculty f ON aa.faculty_id = f.faculty_id
      WHERE aa.offering_id IN (${offerings.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY aa.offering_id, aa.created_at
    `, offerings.map(o => o.offering_id));

    // Group by offering
    const primaryCoordinatorsByOffering = new Map<string, typeof primaryCoordinators[0]>();
    primaryCoordinators.forEach(c => {
      primaryCoordinatorsByOffering.set(c.offering_id, c);
    });

    const secondaryCoordinatorsByOffering = new Map<string, typeof secondaryCoordinators>();
    secondaryCoordinators.forEach(c => {
      const existing = secondaryCoordinatorsByOffering.get(c.offering_id) || [];
      existing.push(c);
      secondaryCoordinatorsByOffering.set(c.offering_id, existing);
    });

    const auditProfessorsByOffering = new Map<string, typeof auditProfessors>();
    auditProfessors.forEach(a => {
      const existing = auditProfessorsByOffering.get(a.offering_id) || [];
      existing.push(a);
      auditProfessorsByOffering.set(a.offering_id, existing);
    });

    return offerings.map(o => ({
      ...o,
      primary_coordinator: primaryCoordinatorsByOffering.get(o.offering_id) || { faculty_id: null, faculty_name: null },
      secondary_coordinators: secondaryCoordinatorsByOffering.get(o.offering_id) || [],
      audit_professors: auditProfessorsByOffering.get(o.offering_id) || [],
    }));
  } catch (error) {
    console.error("Failed to fetch course offerings:", error);
    return [];
  }
}

export async function createCourse(formData: FormData) {
  const code = (formData.get("course_code") as string)?.trim();
  const name = (formData.get("course_name") as string)?.trim();
  const credits = parseInt(formData.get("credits") as string, 10);
  const type = (formData.get("course_type") as string)?.trim();
  const yearStr = formData.get("year_of_study") as string;
  const year_of_study = yearStr ? parseInt(yearStr, 10) : null;

  if (!code || !name || isNaN(credits)) {
    throw new Error("All fields are required.");
  }

  await executeDb(
    "INSERT INTO public.course_master (course_code, course_name, credits, course_type, year_of_study) VALUES ($1, $2, $3, $4, $5)",
    [code, name, credits, type || null, year_of_study]
  );
  revalidatePath("/admin/courses");
}

export type CourseExcelRow = {
  course_code: string;
  course_name: string;
  course_type: string | null;
  year_of_study: number | null;
  credits: number | null;
  error?: string;
};

/** Parse an uploaded courses Excel: columns Course Code | Course Name | Type | Year | Credits. */
export async function parseCoursesExcel(formData: FormData): Promise<CourseExcelRow[]> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Excel file is empty");

  const results: CourseExcelRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const code = row.getCell(1).text?.trim();
    const name = row.getCell(2).text?.trim();
    const type = row.getCell(3).text?.trim();
    const yearRaw = row.getCell(4).text?.trim();
    const creditsRaw = row.getCell(5).text?.trim();
    if (!code && !name) return;

    const yearMatch = yearRaw ? yearRaw.match(/\d+/) : null;
    const year_of_study = yearMatch ? parseInt(yearMatch[0], 10) : null;
    const credits = creditsRaw ? parseInt(creditsRaw, 10) : NaN;

    let error: string | undefined;
    if (!code) error = "Missing course code.";
    else if (!name) error = "Missing course name.";
    else if (isNaN(credits)) error = "Missing or invalid credits.";

    results.push({
      course_code: code || "",
      course_name: name || "",
      course_type: type || null,
      year_of_study,
      credits: isNaN(credits) ? null : credits,
      error,
    });
  });
  return results;
}

/** Insert/update the valid parsed course rows (upsert on course_code). */
export async function bulkAddCourses(
  rows: Array<{ course_code: string; course_name: string; course_type: string | null; year_of_study: number | null; credits: number }>
): Promise<{ inserted: number }> {
  let inserted = 0;
  for (const c of rows) {
    if (!c.course_code || !c.course_name || isNaN(c.credits)) continue;
    await executeDb(
      `INSERT INTO public.course_master (course_code, course_name, credits, course_type, year_of_study)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (course_code) DO UPDATE SET
         course_name = EXCLUDED.course_name,
         credits = EXCLUDED.credits,
         course_type = EXCLUDED.course_type,
         year_of_study = EXCLUDED.year_of_study`,
      [c.course_code.trim(), c.course_name.trim(), c.credits, c.course_type, c.year_of_study]
    );
    inserted++;
  }
  revalidatePath("/admin/courses");
  return { inserted };
}

export async function createCourseOffering(data: {
  course_id: string;
  semester_id: string;
  primary_coordinator_id?: number | null;
  secondary_coordinator_ids?: number[];
  audit_professor_ids?: number[];
}) {
  let offering_id: string;
  try {
    const rows = await queryDb<{ offering_id: string }>(
      "INSERT INTO public.course_offering (course_id, semester_id) VALUES ($1, $2) RETURNING offering_id",
      [data.course_id, data.semester_id]
    );
    offering_id = rows[0]?.offering_id;
    if (!offering_id) throw new Error("Failed to create course offering.");
  } catch (error: any) {
    if (error.message && error.message.includes("course_offering_course_id_semester_id_key")) {
      throw new Error("A course offering for this course and semester already exists.");
    }
    throw error;
  }

  // Add primary coordinator
  if (data.primary_coordinator_id) {
    await executeDb(
      "INSERT INTO public.coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [offering_id, data.primary_coordinator_id]
    );
  }

  // Add secondary coordinators
  if (data.secondary_coordinator_ids && data.secondary_coordinator_ids.length > 0) {
    for (const faculty_id of data.secondary_coordinator_ids) {
      await executeDb(
        "INSERT INTO public.secondary_coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [offering_id, faculty_id]
      );
    }
  }

  // Add audit professors
  if (data.audit_professor_ids && data.audit_professor_ids.length > 0) {
    for (const faculty_id of data.audit_professor_ids) {
      await executeDb(
        "INSERT INTO public.audit_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [offering_id, faculty_id]
      );
    }
  }

  revalidatePath("/admin/offerings");
}

export async function assignCoordinator(offering_id: string, faculty_id: number) {
  await executeDb(
    `INSERT INTO public.coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2)
     ON CONFLICT (offering_id, faculty_id) DO NOTHING`,
    [offering_id, faculty_id]
  );
  revalidatePath("/admin/offerings");
}

export async function createAcademicYear(formData: FormData) {
  const name = (formData.get("year_name") as string)?.trim();
  const start = (formData.get("start_date") as string)?.trim();
  const end = (formData.get("end_date") as string)?.trim();
  if (!name || !start || !end) throw new Error("All fields are required.");
  
  await executeDb(
    "INSERT INTO public.academic_year (year_name, start_date, end_date) VALUES ($1, $2, $3)",
    [name, start, end]
  );
  revalidatePath("/admin/academic-years");
}

export async function createSemester(formData: FormData) {
  const name = (formData.get("semester_name") as string)?.trim();
  const year = (formData.get("year_id") as string)?.trim();
  
  if (!name || !year) throw new Error("All fields are required.");

  const rows = await queryDb<{ semester_id: string }>(
    `INSERT INTO public.semester_master (semester_name, year_id)
     VALUES ($1, $2)
     RETURNING semester_id`,
    [name, year]
  );

  const semesterId = rows[0]?.semester_id;
  if (!semesterId) {
    throw new Error("Failed to create semester.");
  }

  revalidatePath("/admin/semesters");
  revalidatePath("/admin/offerings");
  revalidatePath("/course-coordinator");
  revalidatePath("/faculty");
}

export async function createDepartment(formData: FormData) {
  const name = (formData.get("department_name") as string)?.trim();
  if (!name) throw new Error("Department name is required.");

  await executeDb(
    "INSERT INTO public.department_master (department_name) VALUES ($1)",
    [name]
  );
  revalidatePath("/admin/departments");
}


export async function getAcademicYears() {
  return queryDb<{ year_id: string; year_name: string; start_date: string; end_date: string; created_at: string }>(
    "SELECT * FROM public.academic_year ORDER BY start_date DESC"
  );
}

export async function getCourseOfferingById(offering_id: string): Promise<CourseOffering | null> {
  try {
    const rows = await queryDb<{
      offering_id: string;
      course_id: string;
      semester_id: string;
      course_code: string;
      course_name: string;
      semester_name: string;
      year_name: string;
    }>(`
      SELECT
        co.offering_id,
        co.course_id,
        co.semester_id,
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

    if (!rows[0]) return null;

    const offering = rows[0];

    // Fetch primary coordinator
    const primaryCoordinator = await queryDb<{
      faculty_id: number;
      faculty_name: string;
    }>(`
      SELECT
        ca.faculty_id,
        f.faculty_name
      FROM public.coordinator_assignment ca
      JOIN public.faculty f ON ca.faculty_id = f.faculty_id
      WHERE ca.offering_id = $1
      LIMIT 1
    `, [offering_id]);

    // Fetch secondary coordinators
    const secondaryCoordinators = await queryDb<{
      faculty_id: number;
      faculty_name: string;
    }>(`
      SELECT
        sca.faculty_id,
        f.faculty_name
      FROM public.secondary_coordinator_assignment sca
      JOIN public.faculty f ON sca.faculty_id = f.faculty_id
      WHERE sca.offering_id = $1
      ORDER BY sca.created_at
    `, [offering_id]);

    // Fetch audit professors
    const auditProfessors = await queryDb<{
      faculty_id: number;
      faculty_name: string;
    }>(`
      SELECT
        aa.faculty_id,
        f.faculty_name
      FROM public.audit_assignment aa
      JOIN public.faculty f ON aa.faculty_id = f.faculty_id
      WHERE aa.offering_id = $1
      ORDER BY aa.created_at
    `, [offering_id]);

    return {
      ...offering,
      primary_coordinator: primaryCoordinator[0] || { faculty_id: null, faculty_name: null },
      secondary_coordinators: secondaryCoordinators,
      audit_professors: auditProfessors,
    };
  } catch (error) {
    console.error("Failed to fetch course offering by id:", error);
    return null;
  }
}

export async function updateCourseOffering(
  offering_id: string,
  data: {
    course_id: string;
    semester_id: string;
    primary_coordinator_id?: number | null;
    secondary_coordinator_ids?: number[];
    audit_professor_ids?: number[];
  }
) {
  await executeDb(
    "UPDATE public.course_offering SET course_id = $1, semester_id = $2 WHERE offering_id = $3",
    [data.course_id, data.semester_id, offering_id]
  );

  // Smart update primary coordinator
  if (data.primary_coordinator_id) {
    const existingPrimary = await queryDb("SELECT id FROM public.coordinator_assignment WHERE offering_id = $1", [offering_id]);
    if (existingPrimary.length > 0) {
      await executeDb("UPDATE public.coordinator_assignment SET faculty_id = $1 WHERE offering_id = $2", [data.primary_coordinator_id, offering_id]);
    } else {
      await executeDb("INSERT INTO public.coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2)", [offering_id, data.primary_coordinator_id]);
    }
  } else {
    await executeDb("DELETE FROM public.coordinator_assignment WHERE offering_id = $1", [offering_id]);
  }

  // Smart update secondary coordinators
  const newSecIds = data.secondary_coordinator_ids || [];
  if (newSecIds.length > 0) {
    await executeDb(`DELETE FROM public.secondary_coordinator_assignment WHERE offering_id = $1 AND faculty_id != ALL($2::bigint[])`, [offering_id, `{${newSecIds.join(',')}}`]);
    for (const fid of newSecIds) {
      await executeDb(`INSERT INTO public.secondary_coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT (offering_id, faculty_id) DO NOTHING`, [offering_id, fid]);
    }
  } else {
    await executeDb(`DELETE FROM public.secondary_coordinator_assignment WHERE offering_id = $1`, [offering_id]);
  }

  // Smart update audit professors
  const newAuditIds = data.audit_professor_ids || [];
  if (newAuditIds.length > 0) {
    await executeDb(`DELETE FROM public.audit_assignment WHERE offering_id = $1 AND faculty_id != ALL($2::bigint[])`, [offering_id, `{${newAuditIds.join(',')}}`]);
    for (const fid of newAuditIds) {
      await executeDb(`INSERT INTO public.audit_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT (offering_id, faculty_id) DO NOTHING`, [offering_id, fid]);
    }
  } else {
    await executeDb(`DELETE FROM public.audit_assignment WHERE offering_id = $1`, [offering_id]);
  }

  revalidatePath("/admin/offerings");
}

export async function deleteCourseOffering(offering_id: string) {
  await executeDb("DELETE FROM public.coordinator_assignment WHERE offering_id = $1", [offering_id]);
  await executeDb("DELETE FROM public.secondary_coordinator_assignment WHERE offering_id = $1", [offering_id]);
  await executeDb("DELETE FROM public.audit_assignment WHERE offering_id = $1", [offering_id]);
  await executeDb("DELETE FROM public.course_offering WHERE offering_id = $1", [offering_id]);
  revalidatePath("/admin/offerings");
}

export type OfferingExcelRow = {
  course_code: string;
  semester_name: string;
  year_name: string;
  primary_coordinator_id: number | null;
  secondary_coordinator_ids: number[];
  audit_professor_ids: number[];
  error?: string;
  // Resolved IDs for internal use
  course_id?: string;
  semester_id?: string;
};

/** Parse an uploaded offerings Excel: columns Course Code | Semester Name | Academic Year | Primary Coordinator ID | Secondary Coordinator IDs | Audit Professor IDs */
export async function parseOfferingsExcel(formData: FormData): Promise<OfferingExcelRow[]> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Excel file is empty");

  const results: OfferingExcelRow[] = [];
  
  // Need to resolve codes/names to IDs
  const allCourses = await queryDb<{ course_id: string; course_code: string }>("SELECT course_id, course_code FROM public.course_master");
  const allSemesters = await queryDb<{ semester_id: string; semester_name: string; year_name: string }>(`
    SELECT s.semester_id, s.semester_name, y.year_name 
    FROM public.semester_master s JOIN public.academic_year y ON s.year_id = y.year_id
  `);
  const allFaculty = await queryDb<{ faculty_id: number }>("SELECT faculty_id FROM public.faculty");

  const courseMap = new Map(allCourses.map(c => [c.course_code.toLowerCase(), c.course_id]));
  const semesterMap = new Map(allSemesters.map(s => [`${s.semester_name.toLowerCase()}|${s.year_name.toLowerCase()}`, s.semester_id]));
  const facultySet = new Set(allFaculty.map(f => String(f.faculty_id)));

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const courseCode = row.getCell(1).text?.trim();
    const semName = row.getCell(2).text?.trim();
    const yearName = row.getCell(3).text?.trim();
    const primaryIdRaw = row.getCell(4).text?.trim();
    const secondaryIdsRaw = row.getCell(5).text?.trim();
    const auditIdsRaw = row.getCell(6).text?.trim();

    if (!courseCode && !semName && !yearName) return;

    let error: string | undefined;
    
    const course_id = courseMap.get(courseCode?.toLowerCase() || "");
    const semester_id = semesterMap.get(`${semName?.toLowerCase() || ""}|${yearName?.toLowerCase() || ""}`);
    
    if (!course_id) error = `Course code '${courseCode}' not found.`;
    else if (!semester_id) error = `Semester '${semName}' in year '${yearName}' not found.`;

    const primary_coordinator_id = primaryIdRaw ? parseInt(primaryIdRaw, 10) : null;
    if (primaryIdRaw && isNaN(primary_coordinator_id as number)) error = "Invalid Primary Coordinator ID.";
    else if (primary_coordinator_id && !facultySet.has(String(primary_coordinator_id))) error = `Primary coordinator ${primary_coordinator_id} not found.`;

    const parseIds = (raw: string | number) => {
      if (!raw) return [];
      return String(raw).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    };

    const secondary_coordinator_ids = parseIds(secondaryIdsRaw);
    for (const id of secondary_coordinator_ids) {
      if (!facultySet.has(String(id))) error = `Secondary coordinator ${id} not found.`;
    }

    const audit_professor_ids = parseIds(auditIdsRaw);
    for (const id of audit_professor_ids) {
      if (!facultySet.has(String(id))) error = `Audit professor ${id} not found.`;
    }

    results.push({
      course_code: courseCode || "",
      semester_name: semName || "",
      year_name: yearName || "",
      primary_coordinator_id,
      secondary_coordinator_ids,
      audit_professor_ids,
      course_id,
      semester_id,
      error,
    });
  });

  return results;
}

export async function bulkAddOfferings(rows: OfferingExcelRow[]): Promise<{ inserted: number }> {
  let inserted = 0;
  for (const r of rows) {
    if (!r.course_id || !r.semester_id) continue;
    
    // Create offering
    let offering_id: string;
    try {
      const res = await queryDb<{ offering_id: string }>(
        "INSERT INTO public.course_offering (course_id, semester_id) VALUES ($1, $2) RETURNING offering_id",
        [r.course_id, r.semester_id]
      );
      offering_id = res[0]?.offering_id;
      if (!offering_id) continue;
    } catch (error: any) {
      if (error.message && error.message.includes("course_offering_course_id_semester_id_key")) {
        throw new Error(`A course offering for course code '${r.course_code}' in semester '${r.semester_name}' already exists.`);
      }
      throw error;
    }

    if (r.primary_coordinator_id) {
      await executeDb("INSERT INTO public.coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [offering_id, r.primary_coordinator_id]);
    }

    for (const fid of r.secondary_coordinator_ids) {
      await executeDb("INSERT INTO public.secondary_coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [offering_id, fid]);
    }

    for (const fid of r.audit_professor_ids) {
      await executeDb("INSERT INTO public.audit_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [offering_id, fid]);
    }
    
    inserted++;
  }
  
  revalidatePath("/admin/offerings");
  return { inserted };
}
