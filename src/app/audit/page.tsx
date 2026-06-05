import { getAuditLogs } from "./actions";
import AuditClient from "./AuditClient";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await getAuditLogs();
  
  return <AuditClient initialLogs={logs} />;
}
