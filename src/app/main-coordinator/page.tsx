import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import {
  getCourseComponents,
  getComponentMasters,
  getCoordinatorOfferings,
  getCourseBroadcasts,
} from "./actions";

import { AddComponentForm } from "@/app/dept-coordinator/[offering_id]/AddComponentForm";
import { AddBroadcastForm } from "@/app/dept-coordinator/[offering_id]/AddBroadcastForm";
import { EditableComponentRow } from "@/app/dept-coordinator/[offering_id]/EditableComponentRow";
import { BroadcastCard } from "@/components/ui/BroadcastCard";
import { ClipboardList, Megaphone, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewCourseManagementPage() {
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const offerings = await getCoordinatorOfferings(session.faculty_id);

  if (offerings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            SOC Coordinator Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Course Management</h1>
        </div>
        <div className="panel-card border-dashed border-gray-300 p-5 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h2 className="font-semibold text-gray-600">No courses assigned</h2>
          <p className="text-sm text-gray-400 mt-1">
            You are not assigned to manage any courses yet.
          </p>
        </div>
      </div>
    );
  }

  // Use the first assigned offering for this coordinator
  const offering = offerings[0];
  const offering_id = offering.offering_id;

  const [
    components,
    componentMasters,
    broadcasts,
  ] = await Promise.all([
    getCourseComponents(offering_id),
    getComponentMasters(),
    getCourseBroadcasts(offering_id),
  ]);

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          SOC Coordinator Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{offering.course_name}</h1>
        <p className="mt-1 text-sm text-white/70">
          {offering.course_code} · {offering.semester_name} Semester · {offering.year_name}
        </p>
      </div>

      {/* Course Broadcasts */}
      <div id="broadcasts" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[var(--color-accent)]" />
            Course Broadcasts
          </h2>
          <AddBroadcastForm offering_id={offering_id} faculty_id={session.faculty_id} />
        </div>

        {broadcasts.length === 0 ? (
          <div className="panel-card border-dashed border-gray-200 py-[30px] px-5 text-center">
            <p className="text-sm text-gray-500">No course materials broadcasted yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {broadcasts.map((b) => (
              <BroadcastCard
                key={b.broadcast_id}
                broadcast={{ ...b, course_code: offering.course_code }}
                baseUrl={process.env.R2_PUBLIC_BASE_URL!}
                currentFacultyId={session.faculty_id}
                allowDelete={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Components */}
      <div id="document-requirements" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-400" />
            Document Requirements
          </h2>
          <AddComponentForm offering_id={offering_id} componentMasters={componentMasters} />
        </div>

        {components.length === 0 ? (
          <div className="panel-card border-dashed border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500">
              No components defined. Add document requirements above.
            </p>
          </div>
        ) : (
          <div className="panel-card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
                <tr>
                  <th className="px-5 py-3">Component</th>
                  <th className="px-5 py-3 text-center">Mandatory</th>
                  <th className="px-5 py-3">Deadline</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {components.map((comp) => (
                  <EditableComponentRow
                    key={comp.id}
                    comp={comp}
                    offering_id={offering_id}
                    currentFacultyId={session.faculty_id}
                    baseUrl={process.env.R2_PUBLIC_BASE_URL}
                    readonly={false}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
