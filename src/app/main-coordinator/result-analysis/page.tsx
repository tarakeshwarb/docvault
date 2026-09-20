import { getFacultySession } from "@/lib/auth";
import { getDeptOfferingsForSoc, getSocComponentsByOfferings } from "../actions";
import { SocResultAnalysis } from "../SocResultAnalysis";
import { getCoordinatorOfferings } from "../actions";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SocResultAnalysisPage() {
  const session = await getFacultySession();
  if (!session) return null;

  const [deptOfferings, offerings] = await Promise.all([
    getDeptOfferingsForSoc(session.faculty_id),
    getCoordinatorOfferings(session.faculty_id),
  ]);

  const courseCode = offerings[0]?.course_code ?? "Course";

  const offeringIds = deptOfferings.map(d => d.offering_id).filter(Boolean) as string[];
  const componentsByOffering = await getSocComponentsByOfferings(offeringIds);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          SOC Coordinator
        </p>
        <h1 className="mt-2 text-3xl font-semibold flex items-center gap-3">
          <BarChart3 className="h-7 w-7" />
          Result Analysis
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Select a department (or all) and the components to export result analysis reports.
        </p>
      </div>

      <div className="panel-card p-6">
        <SocResultAnalysis
          deptOfferings={deptOfferings}
          componentsByOffering={componentsByOffering}
          courseCode={courseCode}
        />
      </div>
    </div>
  );
}
