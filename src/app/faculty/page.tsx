// Faculty dashboard: shows all assigned courses and pending submissions.
import { getFacultyCourses, getFacultySubmissions, getFacultyBroadcasts, type PendingSubmission, type FacultyCourseBroadcast } from "./actions";
import { UploadModal } from "./UploadModal";
import { ResultAnalysisModal } from "./ResultAnalysisModal";
import { BroadcastCard } from "@/components/ui/BroadcastCard";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getFacultySession } from "@/lib/auth";

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

export default async function FacultyPage() {
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const [courses, submissions, broadcasts] = await Promise.all([
    getFacultyCourses(session.faculty_id),
    getFacultySubmissions(session.faculty_id),
    getFacultyBroadcasts(session.faculty_id),
  ]);

  const pending = submissions.filter((s: PendingSubmission) => s.status === "pending");
  const submitted = submissions.filter(
    (s: PendingSubmission) => s.status === "submitted" || s.status === "approved"
  );
  const completionPct =
    submissions.length > 0
      ? Math.round((submitted.length / submissions.length) * 100)
      : 0;

  // Group submissions by course offering + section
  const grouped = submissions.reduce(
    (acc, s: PendingSubmission) => {
      const key = `${s.offering_id}::${s.section_name}`;
      if (!acc.has(key)) {
        acc.set(key, {
          courseCode: s.course_code,
          courseName: s.course_name,
          sectionName: s.section_name,
          offeringId: s.offering_id,
          items: [],
          broadcasts: broadcasts.filter(b => b.offering_id === s.offering_id),
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
        broadcasts: FacultyCourseBroadcast[];
      }
    >()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          Faculty workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold">My Submission Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/72">
          Review assigned courses and sections, upload PDFs, Excel sheets, Word files,
          images, or ZIP archives, and monitor every deadline from one portal.
        </p>
      </div>

      {/* Stats - using the navigation card UI style */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Courses", value: courses.length, icon: BookOpen, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
          { label: "Total Tasks", value: submissions.length, icon: Clock, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
          { label: "Submitted", value: submitted.length, icon: CheckCircle2, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
          { label: "Pending", value: pending.length, icon: AlertCircle, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="panel-card panel-card-hover group p-4 flex items-center gap-4"
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



      {/* Course Materials / Broadcasts */}
      <div id="broadcasts" className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[var(--color-accent)]" />
          Course Materials & Broadcasts
        </h2>

        {broadcasts.length === 0 ? (
          <div className="panel-card border-dashed border-gray-300 p-5 text-center">
            <p className="text-sm text-gray-500">No course materials have been broadcasted for your assigned courses.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {broadcasts.map((b) => {
              const offeringStr = courses.find((c) => c.offering_id === b.offering_id)
                ? `${courses.find((c) => c.offering_id === b.offering_id)?.course_code}`
                : "Course Material";
              
              return (
                <BroadcastCard
                  key={b.broadcast_id}
                  broadcast={{
                    ...b,
                    course_code: offeringStr,
                  }}
                  baseUrl={process.env.R2_PUBLIC_BASE_URL!}
                  currentFacultyId={session.faculty_id}
                />
              );
            })}
          </div>
        )}
      </div>

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
            <p className="text-xs text-gray-400">Sorted by course and section</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pending.slice(0, 6).map((submission) => (
              <div key={submission.submission_id} className="panel-card bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{submission.component_name}</p>
                  <StatusBadge status={submission.status} deadline={submission.deadline} />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {submission.course_code} · {submission.course_name} · Section {submission.section_name}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Deadline: {submission.deadline ? formatDate(submission.deadline) : "No deadline set"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions by Course */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Assigned Courses</h2>
        
        {courses.length === 0 ? (
          <div className="panel-card border-dashed border-gray-300 p-5 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <h2 className="font-semibold text-gray-600">No courses assigned</h2>
            <p className="text-sm text-gray-400 mt-1">
              Wait for the Course Coordinator to assign you to a course section.
            </p>
          </div>
        ) : grouped.size === 0 ? (
          <div className="panel-card p-5 text-center">
            <p className="text-sm text-gray-500">
              You are assigned to courses, but no document requirements have been set yet.
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([key, group]) => (
            <div key={key} className="panel-card space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {group.courseCode}
                </span>
                <h2 className="font-semibold text-[var(--color-ink)]">{group.courseName}</h2>
                <span className="text-xs text-gray-400">— Section {group.sectionName}</span>
                {group.items[0] && (
                  <div className="ml-auto">
                    <ResultAnalysisModal
                      offeringId={group.offeringId}
                      facultyAssignmentId={group.items[0].faculty_assignment_id}
                      sectionName={group.sectionName}
                      courseCode={group.courseCode}
                      courseName={group.courseName}
                    />
                  </div>
                )}
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

    </div>
  );
}
