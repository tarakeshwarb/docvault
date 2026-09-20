import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowRight, User, ClipboardList, Users } from "lucide-react";
import { getFacultyOfferings } from "../../actions";
import { getFacultySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FacultyCoursesPage({ params }: { params: Promise<{ dept_id: string, faculty_id: string }> }) {
  const { dept_id, faculty_id } = await params;
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const offerings = await getFacultyOfferings(Number(faculty_id));
  const totalOfferings = offerings.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link href="/main-coordinator" className="hover:text-[var(--color-accent)] transition-colors">Departments</Link>
        <span>/</span>
        <Link href={`/main-coordinator/${dept_id}`} className="hover:text-[var(--color-accent)] transition-colors">Faculties</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{faculty_id}</span>
      </div>

      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          Faculty View
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Assigned Courses</h1>
        <p className="mt-1 text-sm text-white/70">
          Select a course to view this faculty's specific submissions, approvals, and tracking matrix.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Assigned Courses", value: totalOfferings, icon: BookOpen },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <Icon className="h-4 w-4 text-white/70" />
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {offerings.length === 0 ? (
        <div className="panel-card border-dashed border-gray-300 p-5 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h2 className="font-semibold text-gray-600">No courses assigned</h2>
          <p className="text-sm text-gray-400 mt-1">
            This faculty member is not assigned to any courses.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((offering) => (
            <Link
              key={offering.offering_id}
              href={`/main-coordinator/${dept_id}/${faculty_id}/${offering.offering_id}`}
              className="panel-card panel-card-hover group p-5"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-2 py-1 text-xs font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                  {offering.course_code}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-accent)] transition-colors" />
              </div>
              <h3 className="mt-3 font-semibold text-[var(--color-ink)] leading-snug">
                {offering.course_name}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {offering.semester_name} Semester · {offering.year_name}
              </p>
              <p className="mt-1 text-xs text-gray-400">{offering.credits} Credits</p>

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" /> Matrix
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
