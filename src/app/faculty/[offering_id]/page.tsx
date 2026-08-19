import { notFound } from "next/navigation";
import {
  getFacultyCourses,
  getFacultySubmissions,
  getFacultyBroadcasts,
  getFacultyCommonComponents,
  type PendingSubmission,
} from "../actions";
import { UploadModal } from "../UploadModal";
import { ResultAnalysisModal } from "../ResultAnalysisModal";
import { BroadcastCard } from "@/components/ui/BroadcastCard";
import { BookOpen, CheckCircle2, Clock, AlertCircle, Megaphone, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getFacultySession } from "@/lib/auth";
import Link from "next/link";
import { FacultyTabs } from "@/components/faculty/FacultyTabs";
import { ResultAnalysisSummary } from "../ResultAnalysisSummary";

export const dynamic = "force-dynamic";

function StatusBadge({ status, deadline }: { status: string; deadline: string | null }) {
  const isLate = deadline && new Date() > new Date(deadline) && status === "pending";
  const effectiveStatus = isLate ? "late" : status;

  if (effectiveStatus === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  if (effectiveStatus === "submitted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        <CheckCircle2 className="w-3 h-3" /> Submitted
      </span>
    );
  if (effectiveStatus === "late")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertCircle className="w-3 h-3" /> Late
      </span>
    );
  return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        <Clock className="w-3 h-3" /> Pending
      </span>
  );
}

export default async function FacultyCoursePage({
  params,
}: {
  params: Promise<{ offering_id: string }>;
}) {
  const { offering_id } = await params;
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const [allCourses, allSubmissions, allBroadcasts, allCommonComponents] = await Promise.all([
    getFacultyCourses(session.faculty_id),
    getFacultySubmissions(session.faculty_id),
    getFacultyBroadcasts(session.faculty_id),
    getFacultyCommonComponents(session.faculty_id),
  ]);

  const course = allCourses.find((c) => c.offering_id === offering_id);
  
  if (!course) {
    notFound();
  }

  const submissions = allSubmissions.filter(s => s.offering_id === offering_id);
  const broadcasts = allBroadcasts.filter(b => b.offering_id === offering_id);
  const commonComponents = allCommonComponents.filter(c => c.offering_id === offering_id);

  const pending = submissions.filter((s: PendingSubmission) => s.status === "pending");
  const submitted = submissions.filter(
    (s: PendingSubmission) => s.status === "submitted" || s.status === "approved"
  );
  
  // Group submissions by section (a faculty might teach multiple sections of the same course)
  const grouped = submissions.reduce(
    (acc, s: PendingSubmission) => {
      const key = s.section_name;
      if (!acc.has(key)) {
        acc.set(key, {
          courseCode: s.course_code,
          courseName: s.course_name,
          sectionName: s.section_name,
          offeringId: s.offering_id,
          items: [],
        });
      }
      acc.get(key)!.items.push(s);
      return acc;
    },
    new Map<
      string,
      {
        courseCode: string;
        courseName: string;
        sectionName: string;
        offeringId: string;
        items: PendingSubmission[];
      }
    >()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/faculty"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[var(--color-accent)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-3 py-1.5 text-sm font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                {course.course_code}
              </span>
              <span className="text-sm font-medium text-gray-400">
                {course.semester_name} · {course.year_name}
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-ink)]">
              {course.course_name}
            </h1>
          </div>
        </div>
        
        {/* Course Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Sections", value: grouped.size, icon: BookOpen, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
            { label: "Total Tasks", value: submissions.length, icon: Clock, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
            { label: "Submitted", value: submitted.length, icon: CheckCircle2, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
            { label: "Pending", value: pending.length, icon: AlertCircle, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="panel-card p-4 flex items-center gap-4"
            >
              <div className={`rounded-lg p-2 ${color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <h3 className="text-xl font-bold text-[var(--color-ink)]">{value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>


        {/* Faculty Tabs Structure */}
        <div className="mt-8">
          <FacultyTabs
            overviewContent={
              <div className="space-y-8">
                {/* Course Materials / Broadcasts */}
                <div id="broadcasts" className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[var(--color-accent)]" />
                    Course Materials & Broadcasts
                  </h2>

                  {broadcasts.length === 0 ? (
                    <div className="panel-card border-dashed border-gray-300 py-[30px] px-5 text-center">
                      <p className="text-sm text-gray-500">No course materials have been broadcasted for this course.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {broadcasts.map((b) => (
                        <BroadcastCard
                          key={b.broadcast_id}
                          broadcast={{
                            ...b,
                            course_code: course.course_code,
                          }}
                          baseUrl={process.env.R2_PUBLIC_BASE_URL!}
                          currentFacultyId={session.faculty_id}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Common Materials */}
                {commonComponents.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
                      Common Materials
                      <span className="text-xs font-normal text-gray-400">— shared by the coordinator</span>
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {commonComponents.map((c) => (
                        <div key={c.course_component_id} className="panel-card p-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              {c.course_code}
                            </span>
                            <p className="text-sm font-semibold text-[var(--color-ink)]">{c.component_name}</p>
                          </div>
                          <p className="mt-1 truncate text-xs text-gray-500" title={c.common_file_name}>
                            {c.common_file_name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {c.uploaded_by_name ? `Uploaded by ${c.uploaded_by_name}` : "Provided by coordinator"}
                          </p>
                          <a
                            href={`${process.env.R2_PUBLIC_BASE_URL ?? ""}/${c.common_file_key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20"
                          >
                            <CheckCircle2 className="w-3 h-3" /> View / Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming deadlines */}
                {pending.length > 0 && (
                  <div className="panel-card p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                          Priority queue
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">Upcoming submissions</h2>
                      </div>
                      <p className="text-xs text-gray-400">Sorted by deadline</p>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {pending.slice(0, 6).map((submission) => (
                        <div key={submission.submission_id} className="panel-card bg-slate-50/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">{submission.component_name}</p>
                            <StatusBadge status={submission.status} deadline={submission.deadline} />
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Section {submission.section_name}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Deadline: {submission.deadline ? formatDate(submission.deadline) : "No deadline set"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            }
            submissionsContent={
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Course Sections</h2>
                {grouped.size === 0 ? (
                  <div className="panel-card p-5 text-center">
                    <p className="text-sm text-gray-500">
                      No document requirements have been set for this course yet.
                    </p>
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([sectionName, group]) => (
                    <div key={sectionName} className="panel-card space-y-3 p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-2 py-1 text-xs font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                          Section {sectionName}
                        </span>
                      </div>
                      <div className="panel-card mt-4 overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
                            <tr>
                              <th className="px-5 py-3">Document Required</th>
                              <th className="px-5 py-3">Deadline</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5">
                            {group.items.map((sub: PendingSubmission) => (
                              <tr key={sub.submission_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3 font-medium text-[var(--color-ink)]">
                                  {sub.component_name}
                                  {sub.mandatory && (
                                    <span className="ml-2 text-[10px] font-semibold text-orange-500 uppercase">
                                      Required
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3 text-xs text-gray-500">
                                  {sub.deadline ? formatDate(sub.deadline) : "No deadline"}
                                </td>
                                <td className="px-5 py-3">
                                  <StatusBadge status={sub.status} deadline={sub.deadline} />
                                </td>
                                <td className="px-5 py-3">
                                  <UploadModal
                                    submission_id={sub.submission_id}
                                    component_name={sub.component_name}
                                    isSubmitted={sub.status === "submitted" || sub.status === "late"}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            }
            resultsContent={
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">Result Upload & Analysis</h2>
                {grouped.size === 0 ? (
                  <div className="panel-card p-5 text-center">
                    <p className="text-sm text-gray-500">
                      No sections are available for result analysis yet.
                    </p>
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([sectionName, group]) => {
                    if (!group.items[0]) return null;
                    const assignmentId = group.items[0].faculty_assignment_id;
                    return (
                      <div key={sectionName} className="panel-card p-5 space-y-5">
                        {/* Section header + open modal button */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-2 py-1 text-xs font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                            Section {sectionName}
                          </span>
                          <div className="ml-auto">
                            <ResultAnalysisModal
                              offeringId={group.offeringId}
                              facultyAssignmentId={assignmentId}
                              sectionName={sectionName}
                              courseCode={group.courseCode}
                              courseName={group.courseName}
                            />
                          </div>
                        </div>
                        {/* Saved data summary table */}
                        <ResultAnalysisSummary
                          offeringId={group.offeringId}
                          facultyAssignmentId={assignmentId}
                          courseCode={group.courseCode}
                          courseName={group.courseName}
                          sectionName={sectionName}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            }
          />
        </div>
    </div>
  );
}
