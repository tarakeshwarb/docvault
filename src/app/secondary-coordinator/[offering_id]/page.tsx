import { notFound } from "next/navigation";
import Link from "next/link";
import { SendRemindersButton } from "@/components/coordinator/SendRemindersButton";

import { getFacultySession } from "@/lib/auth";
import { BroadcastCard } from "@/components/ui/BroadcastCard";
import {
  getFacultyAssignments,
  getCourseComponents,
  getSubmissionStatus,
  getCoordinatorOfferings,
  getCourseBroadcasts,
} from "../../course-coordinator/actions";
import { AddBroadcastForm } from "../../course-coordinator/[offering_id]/AddBroadcastForm";
import { SubmissionTrackingMatrix } from "../../course-coordinator/[offering_id]/SubmissionTrackingMatrix";
import { CoordinatorResultAnalysis } from "../../course-coordinator/[offering_id]/CoordinatorResultAnalysis";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

import { OfferingTabs } from "@/components/coordinator/OfferingTabs";

export const dynamic = "force-dynamic";

export default async function SecondaryOfferingDetailPage({
  params,
}: {
  params: Promise<{ offering_id: string }>;
}) {
  const { offering_id } = await params;
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const [
    offerings,
    assignments,
    components,
    submissions,
    broadcasts,
  ] =
    await Promise.all([
      getCoordinatorOfferings(session.faculty_id),
      getFacultyAssignments(offering_id),
      getCourseComponents(offering_id),
      getSubmissionStatus(offering_id),
      getCourseBroadcasts(offering_id),
    ]);

  const offering = offerings.find((o) => o.offering_id === offering_id);
  if (!offering) notFound();

  const trackedComponents = components;
  const totalExpected = assignments.length * trackedComponents.length;
  const submitted = submissions.filter((s) => s.status === "submitted" || s.status === "approved").length;
  const completionPct = totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Compact Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[var(--color-accent)] p-5 sm:p-6 rounded-2xl shadow-lg shadow-[var(--color-accent)]/20">
        {/* Left: Title & Stats */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-1 text-xs font-bold text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm">
              {offering.course_code}
            </span>
            <span className="text-xs font-medium text-white/70">
              {offering.semester_name} • {offering.year_name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {offering.course_name}
          </h1>
          
          <div className="mt-5 flex flex-wrap gap-8">
            {[
              { label: "Faculty Assigned", value: assignments.length },
              { label: "Requirements", value: components.length },
              { label: "Completion Rate", value: `${completionPct}%` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{item.label}</p>
                <p className="text-xl font-bold text-white leading-none mt-1.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3">
          <SendRemindersButton offering_id={offering_id} />
        </div>
      </div>

      <OfferingTabs
        overviewContent={
          <div className="space-y-8">
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
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Document Requirements (Read-only view) */}
            <div id="document-requirements" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-gray-400" />
                  Document Requirements
                </h2>
              </div>

              {components.length === 0 ? (
                <div className="panel-card border-dashed border-gray-200 p-5 text-center">
                  <p className="text-sm text-gray-500">
                    No components defined. Please contact the primary course coordinator.
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {components.map((comp) => (
                        <tr key={comp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-[var(--color-ink)]">
                            {comp.component_name}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {comp.mandatory ? (
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {comp.deadline ? formatDate(comp.deadline) : "No deadline"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


          </div>
        }
        facultyContent={
          <div className="space-y-8">
            {/* Faculty Assignments (Read-only view) */}
            <div id="faculty-assignments" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  Faculty & Sections
                </h2>
              </div>

              {assignments.length === 0 ? (
                <div className="panel-card border-dashed border-gray-200 p-5 text-center">
                  <p className="text-sm text-gray-500">No faculty assigned yet.</p>
                </div>
              ) : (
                <div className="panel-card overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
                      <tr>
                        <th className="px-5 py-3">Faculty</th>
                        <th className="px-5 py-3">Section</th>
                        <th className="px-5 py-3 text-center">Students</th>
                        <th className="px-5 py-3 text-center">Submitted</th>
                        <th className="px-5 py-3 text-center">Pending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {assignments.map((fa) => {
                        const faSubmissions = submissions.filter(
                          (s) => s.faculty_assignment_id === fa.id
                        );
                        const submittedCount = faSubmissions.filter((s) => s.status === "submitted" || s.status === "approved").length;
                        const pendingCount = faSubmissions.filter((s) => s.status === "pending").length;
                        return (
                          <tr key={fa.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-medium text-[var(--color-ink)]">{fa.faculty_name}</div>
                              <div className="text-xs text-gray-400">{fa.email || "No email"}</div>
                            </td>
                            <td className="px-5 py-3 font-medium text-[var(--color-accent)]">
                              Sec {fa.section_name}
                            </td>
                            <td className="px-5 py-3 text-center text-gray-500">
                              {fa.student_count}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                {submittedCount}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                                {pendingCount}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        }
        trackingContent={
          <div className="space-y-8">
            <SubmissionTrackingMatrix
              offering_id={offering_id}
              assignments={assignments}
              components={trackedComponents}
              submissions={submissions}
              currentFacultyId={session.faculty_id}
              baseUrl={process.env.R2_PUBLIC_BASE_URL ?? ""}
            />
          </div>
        }
        resultAnalysisContent={
          <div className="space-y-8">
            <CoordinatorResultAnalysis
              offeringId={offering_id}
              courseCode={offering.course_code}
              components={components}
            />
          </div>
        }
      />
    </div>
  );
}
