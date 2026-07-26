// Faculty dashboard: shows all assigned courses and pending submissions.
import { getFacultyCourses, getFacultySubmissions, type PendingSubmission } from "./actions";
import { BookOpen, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getFacultySession } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FacultyPage() {
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const [courses, submissions] = await Promise.all([
    getFacultyCourses(session.faculty_id),
    getFacultySubmissions(session.faculty_id),
  ]);

  const pending = submissions.filter((s: PendingSubmission) => s.status === "pending");
  const submitted = submissions.filter(
    (s: PendingSubmission) => s.status === "submitted" || s.status === "approved"
  );

  // Deduplicate courses by offering_id and aggregate sections
  const uniqueOfferings = Array.from(
    courses.reduce((acc, course) => {
      if (!acc.has(course.offering_id)) {
        acc.set(course.offering_id, {
          ...course,
          sections: [course.section_name],
        });
      } else {
        acc.get(course.offering_id)!.sections.push(course.section_name);
      }
      return acc;
    }, new Map<string, typeof courses[0] & { sections: string[] }>()).values()
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
          Select an assigned course to upload required documents, monitor deadlines, and view course materials.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Courses", value: uniqueOfferings.length, icon: BookOpen, color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10" },
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

      {/* Assigned Courses Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Assigned Courses</h2>
        
        {uniqueOfferings.length === 0 ? (
          <div className="panel-card border-dashed border-gray-300 p-5 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <h2 className="font-semibold text-gray-600">No courses assigned</h2>
            <p className="text-sm text-gray-400 mt-1">
              Wait for the Course Coordinator to assign you to a course section.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {uniqueOfferings.map((course) => {
              const courseSubmissions = submissions.filter(s => s.offering_id === course.offering_id);
              const coursePending = courseSubmissions.filter(s => s.status === "pending").length;

              return (
                <Link
                  key={course.offering_id}
                  href={`/faculty/${course.offering_id}`}
                  className="panel-card panel-card-hover group p-5 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                      {course.course_code}
                    </span>
                    <span className="text-xs font-medium text-gray-400 shrink-0">
                      Sections: {course.sections.join(", ")}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-[var(--color-ink)] text-lg mb-1 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                    {course.course_name}
                  </h3>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-black/5">
                    <span className="text-xs text-gray-500 font-medium">
                      {course.semester_name} · {course.year_name}
                    </span>
                    {coursePending > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        <AlertCircle className="w-3 h-3" />
                        {coursePending} Pending
                      </span>
                    ) : courseSubmissions.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Caught Up
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
