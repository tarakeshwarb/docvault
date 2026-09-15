import { getFacultySession } from "@/lib/auth";
import { getHodDetailedData, getHodDeptStats, getHodAuditReports } from "./actions";
import HodClient from "./HodClient";

export const dynamic = "force-dynamic";

export default async function HodPage() {
  const session = await getFacultySession();
  if (!session) return null;

  const [stats, detailedData, auditReports] = await Promise.all([
    getHodDeptStats(),
    getHodDetailedData(),
    getHodAuditReports(),
  ]);

  return (
    <HodClient 
      initialRows={detailedData} 
      initialStats={stats} 
      auditReports={auditReports}
      baseUrl={process.env.R2_PUBLIC_BASE_URL || ""} 
    />
  );
}
