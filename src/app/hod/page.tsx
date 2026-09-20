import { getFacultySession } from "@/lib/auth";
import { getHodCourses } from "./actions";
import Link from "next/link";
import { BookOpen, TrendingUp, CheckCircle2, Clock, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default async function HodPage() {
  const session = await getFacultySession();
  if (!session) return null;

  const courses = await getHodCourses();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          HOD Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Department Overview</h1>
        <p className="mt-1 text-sm text-white/70 max-w-2xl">
          Select a course to monitor faculty submissions, view result analysis, and review audit reports.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Live data</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Active semester</span>
        </div>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="panel-card px-6 py-16 text-center text-gray-400">
          <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="text-sm font-medium">No active courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.offering_id}
              href={`/hod/${course.offering_id}`}
              className="group panel-card p-5 flex flex-col gap-4 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                    {course.course_code}
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold text-[var(--color-ink)] leading-snug line-clamp-2">
                    {course.course_name}
                  </h2>
                  <p className="mt-1 text-xs text-gray-400">
                    {course.semester_name} · {course.year_name} · {course.credits} credits
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-accent)] transition-colors shrink-0 mt-1" />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {course.submitted_count} submitted
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {course.total_submissions - course.submitted_count} pending
                </span>
              </div>

              {/* Completion bar */}
              <div>
                <CompletionBar pct={course.completion_pct} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
