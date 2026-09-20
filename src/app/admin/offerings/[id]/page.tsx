import { notFound } from "next/navigation";
import { getCourseOfferingById, getCourses, getAllFaculty, getDepartments } from "../../actions";
import { queryDb } from "@/lib/db";
import EditOfferingClient from "./EditOfferingClient";

async function getSemesters() {
  return queryDb<{ semester_id: string; semester_name: string; year_name: string }>(`
    SELECT s.semester_id, s.semester_name, y.year_name
    FROM public.semester_master s
    JOIN public.academic_year y ON s.year_id = y.year_id
    ORDER BY y.start_date DESC, s.semester_name
  `);
}

export default async function EditOfferingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offering = await getCourseOfferingById(id);

  if (!offering) {
    notFound();
  }

  const [courses, allFaculty, semesters, departments] = await Promise.all([
    getCourses(),
    getAllFaculty(),
    getSemesters(),
    getDepartments(),
  ]);

  const coordinators = allFaculty;

  return (
    <EditOfferingClient
      offering={offering}
      courses={courses}
      semesters={semesters}
      coordinators={coordinators}
      departments={departments}
    />
  );
}
