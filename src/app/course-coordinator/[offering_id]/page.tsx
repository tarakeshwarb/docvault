import { notFound } from "next/navigation";
import Link from "next/link";
import { CoordinatorToolbar } from "@/components/coordinator/CoordinatorToolbar";
import { CoordinatorExportButton } from "@/components/coordinator/CoordinatorExportButton";
import { getFacultySession } from "@/lib/auth";
import { SubmissionFilesModal } from "@/components/coordinator/SubmissionFilesModal";
import { BroadcastCard } from "@/components/ui/BroadcastCard";
import { ConfirmDownloadLink } from "@/components/ui/ConfirmDownloadLink";
import {
  getFacultyAssignments,
  getCourseComponents,
  getSubmissionStatus,
  getGeneratedReports,
  generateConsolidatedReport,
  getComponentMasters,
  getAllSections,
  getAllFacultyForAssignment,
  getCoordinatorOfferings,
  getCourseBroadcasts,
} from "../actions";
import { AddFacultyForm } from "./AddFacultyForm";
import { AddComponentForm } from "./AddComponentForm";
import { AddBroadcastForm } from "./AddBroadcastForm";
import { EditableComponentRow } from "./EditableComponentRow";
import { EditableFacultyRow } from "./EditableFacultyRow";
import { SubmissionTrackingMatrix } from "./SubmissionTrackingMatrix";
import { CoordinatorResultAnalysis } from "./CoordinatorResultAnalysis";
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

function StatusBadge({ status }: { status: string }) {
  if (status === "submitted") {
    return (
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
        <CheckCircle2 className="w-3 h-3" />
        Submitted
      </div>
    );
  }
  if (status === "late") {
    return (
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
        <AlertCircle className="w-3 h-3" />
        Late
      </div>
    );
  }
  return (
    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 ring-1 ring-inset ring-gray-500/10">
      <Clock className="w-3 h-3" />
      Pending
    </div>
  );
}

export default async function OfferingDetailPage({
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
    reports,
    componentMasters,
    allSections,
    allFaculty,
    broadcasts,
  ] =
    await Promise.all([
      getCoordinatorOfferings(session.faculty_id),
      getFacultyAssignments(offering_id),
      getCourseComponents(offering_id),
      getSubmissionStatus(offering_id),
      getGeneratedReports(offering_id),
      getComponentMasters(),
      getAllSections(),
      getAllFacultyForAssignment(),
      getCourseBroadcasts(offering_id),
    ]);

  const offering = offerings.find((o) => o.offering_id === offering_id);
  if (!offering) notFound();

  // Common components have one shared file (no per-faculty submissions), so they
  // are excluded from the per-faculty submission tracking + completion metrics.
  const trackedComponents = components.filter((c) => !c.is_common);
  const totalExpected = assignments.length * trackedComponents.length;
  const submitted = submissions.filter((s) => s.status === "submitted" || s.status === "approved").length;
  const completionPct = totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0;

  const submissionMap = new Map(
    submissions.map((s) => [`${s.faculty_assignment_id}::${s.course_component_id}`, s])
  );

  const statusByKey: Record<string, string> = Object.fromEntries(
    submissions.map((s) => [
      `${s.faculty_assignment_id}::${s.course_component_id}`,
      s.status,
    ])
  );

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

        {/* Right: Actions & Reports */}
        <div className="flex flex-col gap-3 w-full lg:w-[320px] shrink-0">
          <div className="flex items-center justify-start lg:justify-end gap-2">
            <Link
              href={`/course-coordinator/${offering_id}/result-analysis`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/25 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Result Analysis
            </Link>
            <CoordinatorToolbar offering_id={offering_id} />
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-2">Generate Reports</p>
            <form action={generateConsolidatedReport} className="flex gap-2">
              <input type="hidden" name="offering_id" value={offering_id} />
              <input type="hidden" name="generated_by" value={session.faculty_id} />
              <select
                name="report_type"
                defaultValue="consolidated_marks_report"
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white focus:ring-1 focus:ring-white"
              >
                <option value="consolidated_marks_report" className="text-[var(--color-ink)]">Consolidated Marks</option>
                <option value="result_analysis_report" className="text-[var(--color-ink)]">Result Analysis</option>
                <option value="course_outcome_analysis" className="text-[var(--color-ink)]">Outcome Analysis</option>
                <option value="attendance_report" className="text-[var(--color-ink)]">Attendance Report</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition hover:bg-white/90"
              >
                Create
              </button>
            </form>
          </div>
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
          <div className="panel-card border-dashed border-gray-200 p-5 text-center">
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
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generated reports */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-gray-400" />
          Generated Reports
        </h2>

        {submissions.length === 0 ? (
          <div className="panel-card border-dashed border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500">Generate a report after faculty begin uploading files.</p>
          </div>
        ) : (
          <div className="panel-card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
                <tr>
                  <th className="px-5 py-3">Report Type</th>
                  <th className="px-5 py-3">Generated By</th>
                  <th className="px-5 py-3">Generated At</th>
                  <th className="px-5 py-3 text-right">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                      No reports generated yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.report_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-[var(--color-ink)]">
                        {report.report_type.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {report.generated_by_name ?? "System"}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {formatDate(report.generated_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ConfirmDownloadLink
                          href={report.r2_report_path}
                          className="text-[var(--color-accent)] hover:underline"
                          target="_blank"
                        >
                          Download
                        </ConfirmDownloadLink>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

          </div>
        }
        facultyContent={
          <div className="space-y-8">
      {/* Faculty Assignments */}
      <div id="faculty-assignments" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Faculty & Sections
          </h2>
          <AddFacultyForm
            offering_id={offering_id}
            allFaculty={allFaculty}
            allSections={allSections}
          />
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
                  <th className="px-5 py-3"></th>
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
                    <EditableFacultyRow
                      key={fa.id}
                      fa={fa}
                      allSections={allSections}
                      allFaculty={allFaculty}
                      submittedCount={submittedCount}
                      pendingCount={pendingCount}
                      offering_id={offering_id}
                    />
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