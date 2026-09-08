import { getAuditData } from "./actions";
import AuditClient from "./AuditClient";
import { getFacultySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getFacultySession();
  const rows = await getAuditData(
    session
      ? { facultyId: session.faculty_id, isAdmin: session.role === "admin" }
      : undefined
  );

  return <AuditClient initialRows={rows} />;
}
