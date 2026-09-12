import { getAuditData, getAuditCourses } from "./actions";
import AuditClient from "./AuditClient";
import { getFacultySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getFacultySession();
  if (!session) return null;

  const isAdmin = session.role === "admin";
  const params = { facultyId: session.faculty_id, isAdmin };

  const [rows, auditCourses] = await Promise.all([
    getAuditData(params),
    getAuditCourses(params),
  ]);

  return (
    <AuditClient
      initialRows={rows}
      auditCourses={auditCourses}
      baseUrl={process.env.R2_PUBLIC_BASE_URL || ""}
      facultyId={session.faculty_id}
      isAdmin={isAdmin}
    />
  );
}

