"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type Course = {
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
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
  coordinator_id: number | null;
  coordinator_name: string | null;
};

export async function getCourses(): Promise<Course[]> {
  try {
    return await queryDb<Course>(
      "SELECT * FROM public.course_master ORDER BY course_code ASC"
    );
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
  data: { course_code: string; course_name: string; credits: number }
) {
  await executeDb(
    `UPDATE public.course_master 
     SET course_code = $1, course_name = $2, credits = $3 
     WHERE course_id = $4`,
    [data.course_code, data.course_name, data.credits, course_id]
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
    return await queryDb<CourseOffering>(`
      SELECT
        co.offering_id,
        co.course_id,
        co.semester_id,
        cm.course_code,
        cm.course_name,
        sm.semester_name,
        ay.year_name,
        ca.faculty_id AS coordinator_id,
        f.faculty_name AS coordinator_name
      FROM public.course_offering co
      JOIN public.course_master cm ON co.course_id = cm.course_id
      JOIN public.semester_master sm ON co.semester_id = sm.semester_id
      JOIN public.academic_year ay ON sm.year_id = ay.year_id
      LEFT JOIN public.coordinator_assignment ca ON co.offering_id = ca.offering_id
      LEFT JOIN public.faculty f ON ca.faculty_id = f.faculty_id
      ORDER BY ay.start_date DESC, sm.semester_name, cm.course_code
    `);
  } catch (error) {
    console.error("Failed to fetch course offerings:", error);
    return [];
  }
}

export async function createCourse(formData: FormData) {
  const code = (formData.get("course_code") as string)?.trim();
  const name = (formData.get("course_name") as string)?.trim();
  const credits = parseInt(formData.get("credits") as string, 10);

  if (!code || !name || isNaN(credits)) {
    throw new Error("All fields are required.");
  }

  await executeDb(
    "INSERT INTO public.course_master (course_code, course_name, credits) VALUES ($1, $2, $3)",
    [code, name, credits]
  );
  revalidatePath("/admin/courses");
}

export async function createCourseOffering(data: {
  course_id: string;
  semester_id: string;
  coordinator_id?: number | null;
}) {
  const rows = await queryDb<{ offering_id: string }>(
    "INSERT INTO public.course_offering (course_id, semester_id) VALUES ($1, $2) RETURNING offering_id",
    [data.course_id, data.semester_id]
  );
  const offering_id = rows[0]?.offering_id;
  if (!offering_id) throw new Error("Failed to create course offering.");

  if (data.coordinator_id) {
    await executeDb(
      "INSERT INTO public.coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [offering_id, data.coordinator_id]
    );
    await executeDb(
      "UPDATE public.faculty SET role = 'course_coordinator' WHERE faculty_id = $1 AND role = 'faculty'",
      [data.coordinator_id]
    );
  }
  revalidatePath("/admin/offerings");
}

export async function assignCoordinator(offering_id: string, faculty_id: number) {
  await executeDb(
    `INSERT INTO public.coordinator_assignment (offering_id, faculty_id) VALUES ($1, $2)
     ON CONFLICT (offering_id, faculty_id) DO NOTHING`,
    [offering_id, faculty_id]
  );
  await executeDb(
    "UPDATE public.faculty SET role = 'course_coordinator' WHERE faculty_id = $1 AND role = 'faculty'",
    [faculty_id]
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

export async function createFaculty(formData: FormData) {
  const id = parseInt(formData.get("faculty_id") as string, 10);
  const name = (formData.get("faculty_name") as string)?.trim();
  const desig = (formData.get("designation") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() || "faculty";

  if (!id || !name || !desig || !email) throw new Error("All required fields must be provided.");

  await executeDb(
    "INSERT INTO public.faculty (faculty_id, faculty_name, designation, email, role) VALUES ($1, $2, $3, $4, $5)",
    [id, name, desig, email, role]
  );
  revalidatePath("/admin/faculty");
}

export async function getAcademicYears() {
  return queryDb<{ year_id: string; year_name: string; start_date: string; end_date: string; created_at: string }>(
    "SELECT * FROM public.academic_year ORDER BY start_date DESC"
  );
}
