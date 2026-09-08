import { getFacultySession } from "@/lib/auth";
import { getHodDetailedData, getHodDeptStats } from "./actions";
import HodClient from "./HodClient";

export const dynamic = "force-dynamic";

export default async function HodPage() {
  const session = await getFacultySession();
  if (!session) return null;

  const [stats, detailedData] = await Promise.all([
    getHodDeptStats(),
    getHodDetailedData(),
  ]);

  return <HodClient initialData={detailedData} stats={stats} />;
}
