import { getCourses, getAllFaculty } from "../../actions";
import { queryDb } from "@/lib/db";
import NewOfferingClient from "./NewOfferingClient";

async function getSemesters() {
  return queryDb<{ semester_id: string; semester_name: string; year_name: string }>(`
    SELECT s.semester_id, s.semester_name, y.year_name
    FROM public.semester_master s
    JOIN public.academic_year y ON s.year_id = y.year_id
    ORDER BY y.start_date DESC, s.semester_name
  `);
}

export default async function NewOfferingPage() {
  const [courses, allFaculty, semesters] = await Promise.all([
    getCourses(),
    getAllFaculty(),
    getSemesters(),
  ]);

  // All faculty except admin are eligible to be assigned as coordinator.
  // The createCourseOffering action automatically upgrades their role on assignment.
  const coordinators = allFaculty.filter((f) => f.role !== "admin");

  return (
    <NewOfferingClient
      courses={courses}
      semesters={semesters}
      coordinators={coordinators}
    />
  );
}
