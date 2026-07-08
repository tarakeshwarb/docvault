import { getAuditLogs } from "./actions";
import AuditClient from "./AuditClient";
import { getFacultySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getFacultySession();
  const logs = await getAuditLogs(
    session
      ? { facultyId: session.faculty_id, isAdmin: session.role === "admin" }
      : undefined
  );

  return <AuditClient initialLogs={logs} />;
}
