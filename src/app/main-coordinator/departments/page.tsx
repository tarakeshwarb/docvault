import { getFacultySession } from "@/lib/auth";
import { getSocTrackingData, getCoordinatorOfferings } from "../actions";
import { SocDeptTrackingView } from "../SocDeptTrackingView";
import { BookOpen, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const session = await getFacultySession();
  if (!session) return null;

  const [trackingData, offerings] = await Promise.all([
    getSocTrackingData(session.faculty_id),
    getCoordinatorOfferings(session.faculty_id),
  ]);

  const offering = offerings[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          SOC Coordinator · All Departments
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Submission Tracking</h1>
        <p className="mt-1 text-sm text-white/70">
          View all faculty submissions across every department. Use the filter chips to focus on a specific department.
        </p>
        {offering && (
          <div className="mt-5 flex flex-wrap gap-6">
            {[
              { icon: BookOpen, label: "Course", value: offering.course_name },
              { icon: Building2, label: "Departments", value: trackingData.depts.length },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <item.icon className="h-4 w-4 text-white/70" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                  <p className="font-semibold text-white text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SocDeptTrackingView
        assignments={trackingData.assignments}
        components={trackingData.components}
        submissions={trackingData.submissions}
        depts={trackingData.depts}
        currentFacultyId={session.faculty_id}
        baseUrl={process.env.R2_PUBLIC_BASE_URL ?? ""}
        offering_id={offering?.offering_id ?? ""}
      />
    </div>
  );
}
