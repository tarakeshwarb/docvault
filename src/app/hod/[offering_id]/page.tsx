import { notFound } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import {
  getHodDetailedDataForOffering,
  getHodAuditReportsForOffering,
  getHodCourses,
} from "../actions";
import HodOfferingClient from "./HodOfferingClient";

export const dynamic = "force-dynamic";

export default async function HodOfferingPage({
  params,
}: {
  params: Promise<{ offering_id: string }>;
}) {
  const session = await getFacultySession();
  if (!session) return null;

  const { offering_id } = await params;

  const [courses, rows, auditReports] = await Promise.all([
    getHodCourses(),
    getHodDetailedDataForOffering(offering_id),
    getHodAuditReportsForOffering(offering_id),
  ]);

  // Find course info from the courses list
  const course = courses.find((c) => c.offering_id === offering_id);
  if (!course) notFound();

  return (
    <HodOfferingClient
      offeringId={offering_id}
      courseCode={course.course_code}
      courseName={course.course_name}
      semesterName={course.semester_name}
      yearName={course.year_name}
      initialRows={rows}
      auditReports={auditReports}
      baseUrl={process.env.R2_PUBLIC_BASE_URL || ""}
    />
  );
}
