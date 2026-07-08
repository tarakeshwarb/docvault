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

  const totalExpected = assignments.length * components.length;
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
      {/* Header */}
      <div>


        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-3 py-1.5 text-sm font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                {offering.course_code}
              </span>
              <span className="text-sm font-medium text-gray-400">
                {offering.semester_name} · {offering.year_name}
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-ink)]">
              {offering.course_name}
            </h1>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_3fr]">
          <div className="panel-card h-fit self-center p-6">
            <div className="grid gap-4 grid-cols-1">
              {[
                { label: "Faculty Assigned", value: assignments.length },
                { label: "Components Required", value: components.length },
                { label: "Completion", value: `${completionPct}%` },
              ].map((item) => (
                <div key={item.label} className="panel-card bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold text-[var(--color-ink)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-[var(--color-accent)] p-5 text-white shadow-[0_18px_45px_rgba(12,77,162,0.16)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
              One-click reports
            </p>
            <h2 className="mt-1.5 text-xl font-semibold">Generate consolidated academic files</h2>
            <form action={generateConsolidatedReport} className="mt-4 space-y-3">
              <input type="hidden" name="offering_id" value={offering_id} />
              <input type="hidden" name="generated_by" value={session.faculty_id} />
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Report type
                </label>
                <select
                  name="report_type"
                  defaultValue="consolidated_marks_report"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none backdrop-blur"
                >
                  <option value="consolidated_marks_report" className="text-[var(--color-ink)]">
                    Consolidated Marks Report
                  </option>
                  <option value="result_analysis_report" className="text-[var(--color-ink)]">
                    Result Analysis Report
                  </option>
                  <option value="course_outcome_analysis" className="text-[var(--color-ink)]">
                    Course Outcome Analysis
                  </option>
                  <option value="attendance_report" className="text-[var(--color-ink)]">
                    Attendance Report
                  </option>
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:-translate-y-0.5"
              >
                Generate and store in R2
              </button>
            </form>
            <div className="mt-3">
              <CoordinatorToolbar offering_id={offering_id} />
            </div>
          </div>
        </div>
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

      {/* Submission Tracking Matrix */}
      {assignments.length > 0 && components.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-accent)]" />
              Submission Tracking
            </h2>
            <CoordinatorExportButton
              offering={{
                course_code: offering.course_code,
                course_name: offering.course_name,
                semester_name: offering.semester_name,
                year_name: offering.year_name,
              }}
              assignments={assignments.map((fa) => ({
                id: fa.id,
                faculty_name: fa.faculty_name,
                section_name: fa.section_name,
              }))}
              components={components.map((c) => ({
                id: c.id,
                component_name: c.component_name,
              }))}
              statuses={statusByKey}
            />
          </div>
          <div className="panel-card overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-black/5">
                <tr>
                  <th className="px-5 py-4 whitespace-nowrap min-w-[200px]">Faculty & Progress</th>
                  {components.map((comp) => (
                    <th
                      key={comp.id}
                      className="px-4 py-4 text-center whitespace-nowrap min-w-[120px]"
                      title={comp.component_name}
                    >
                      {comp.component_name.length > 15
                        ? comp.component_name.slice(0, 15) + "…"
                        : comp.component_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {assignments.map((fa) => {
                  const faSubmissions = submissions.filter((s) => s.faculty_assignment_id === fa.id);
                  const submittedCount = faSubmissions.filter((s) => s.status === "submitted" || s.status === "approved").length;
                  const totalFaExpected = components.length;
                  const progressPct = totalFaExpected > 0 ? Math.round((submittedCount / totalFaExpected) * 100) : 0;

                  return (
                    <tr key={fa.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold ring-1 ring-inset ring-[var(--color-accent)]/20">
                            {fa.faculty_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-ink)]">{fa.faculty_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400">
                                SEC {fa.section_name}
                              </span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      {components.map((comp) => {
                        const sub = submissionMap.get(`${fa.id}::${comp.id}`);
                        const status = sub?.status ?? "pending";
                        return (
                          <td key={comp.id} className="px-4 py-4 text-center">
                            <SubmissionFilesModal
                            submission_id={sub?.submission_id ?? ""}
                           faculty_name={fa.faculty_name}
                           component_name={comp.component_name}
                           section_name={fa.section_name}
                           status={status}
                           offering_id={offering_id}
                           currentFacultyId={session.faculty_id}
                           />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
