import { getFacultySession } from "@/lib/auth";
import { getHodCourseOverview, getHodFacultySummary, getHodDeptStats } from "./actions";
import {
  BookOpen, Users, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Eye
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

function StatusPill({ count, type }: { count: number; type: "submitted" | "pending" | "late" }) {
  const styles = {
    submitted: "bg-green-50 text-green-700 ring-green-600/20",
    pending: "bg-gray-50 text-gray-600 ring-gray-500/10",
    late: "bg-red-50 text-red-700 ring-red-600/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[type]}`}>
      {count}
    </span>
  );
}

export default async function HodPage() {
  const session = await getFacultySession();
  if (!session) return null;

  const [stats, courses, faculty] = await Promise.all([
    getHodDeptStats(),
    getHodCourseOverview(),
    getHodFacultySummary(),
  ]);

  const atRiskCourses = courses.filter(c => c.completion_pct < 50);
  const pendingFaculty = faculty.filter(f => f.pending_count > 0);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          HOD Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Department Overview</h1>
        <p className="mt-1 text-sm text-white/70 max-w-2xl">
          Monitor all course file submissions across your department. View faculty progress,
          identify pending submissions, and download audit reports.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Read-only view</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Live data</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Current semester</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Active Courses", value: stats.total_courses, icon: BookOpen },
          { label: "Faculty", value: stats.total_faculty, icon: Users },
          { label: "Total Tasks", value: stats.total_submissions, icon: Clock },
          { label: "Submitted", value: stats.submitted_count, icon: CheckCircle2 },
          { label: "Pending", value: stats.pending_count, icon: AlertCircle },
          { label: "Completion", value: `${stats.overall_completion_pct}%`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel-card p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-[var(--color-accent)]/10 shrink-0">
              <Icon className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="text-xl font-bold text-[var(--color-ink)]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* At-risk courses alert */}
      {atRiskCourses.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-700">
              {atRiskCourses.length} course{atRiskCourses.length > 1 ? "s" : ""} below 50% completion
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {atRiskCourses.map(c => (
              <span key={c.offering_id} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                {c.course_code} — {c.completion_pct}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Course-wise completion table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-400" />
            Course Submission Status
          </h2>
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            <Eye className="w-4 h-4" />
            Full Audit Log
          </Link>
        </div>

        <div className="panel-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
                <tr>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Coordinator</th>
                  <th className="px-5 py-3 text-center">Faculty</th>
                  <th className="px-5 py-3 text-center">Submitted</th>
                  <th className="px-5 py-3 text-center">Pending</th>
                  <th className="px-5 py-3 min-w-[160px]">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                      No active courses found.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.offering_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-semibold text-[var(--color-ink)]">{course.course_code}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{course.course_name}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {course.coordinator_name ?? <span className="text-gray-400 italic">Not assigned</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusPill count={course.total_faculty} type="pending" />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusPill count={course.submitted_count} type="submitted" />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusPill count={course.pending_count} type="pending" />
                      </td>
                      <td className="px-5 py-3">
                        <CompletionBar pct={course.completion_pct} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Faculty submission summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          Faculty Submission Summary
        </h2>

        <div className="panel-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
                <tr>
                  <th className="px-5 py-3">Faculty</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3 text-center">Total Tasks</th>
                  <th className="px-5 py-3 text-center">Submitted</th>
                  <th className="px-5 py-3 text-center">Pending</th>
                  <th className="px-5 py-3 min-w-[140px]">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {faculty.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                      No faculty found.
                    </td>
                  </tr>
                ) : (
                  faculty.map((f) => {
                    const pct = f.total_assigned > 0
                      ? Math.round((f.submitted_count / f.total_assigned) * 100)
                      : 0;
                    return (
                      <tr key={f.faculty_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold text-sm">
                              {f.faculty_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-[var(--color-ink)]">{f.faculty_name}</p>
                              <p className="text-xs text-gray-400">{f.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{f.designation}</td>
                        <td className="px-5 py-3 text-center text-gray-600">{f.total_assigned}</td>
                        <td className="px-5 py-3 text-center">
                          <StatusPill count={f.submitted_count} type="submitted" />
                        </td>
                        <td className="px-5 py-3 text-center">
                          {f.pending_count > 0
                            ? <StatusPill count={f.pending_count} type="pending" />
                            : <span className="text-xs text-green-600 font-medium">✓ All done</span>
                          }
                        </td>
                        <td className="px-5 py-3">
                          <CompletionBar pct={pct} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
