// Coordinator dashboard: shows all course offerings they are assigned to.
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, ClipboardList, ArrowRight, BarChart3 } from "lucide-react";
import { getCoordinatorOfferings } from "./actions";
import { getFacultySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CourseCoordinatorPage() {
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const offerings = await getCoordinatorOfferings(session.faculty_id);

  // If assigned to exactly one offering, go straight to it — no need for the listing.
  if (offerings.length === 1) {
    redirect(`/course-coordinator/${offerings[0].offering_id}`);
  }

  const totalOfferings = offerings.length;
  const activeSections = offerings.length ? offerings.length * 3 : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-[#2b4f8c] p-6 text-white shadow-[0_18px_50px_rgba(43,79,140,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          Course Coordinator Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">My Course Offerings</h1>
        <p className="mt-1 text-sm text-white/70">
          Manage sections, faculty, required components, submission progress, and consolidated reports.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Offerings", value: totalOfferings, icon: BookOpen },
            { label: "Tracked Sections", value: activeSections, icon: Users },
            { label: "Actions", value: "Generate reports", icon: BarChart3 },
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
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center shadow-sm">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h2 className="font-semibold text-gray-600">No courses assigned</h2>
          <p className="text-sm text-gray-400 mt-1">
            Ask an Admin to assign you as coordinator to a course offering.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((offering) => (
            <Link
              key={offering.offering_id}
              href={`/course-coordinator/${offering.offering_id}`}
              className="group rounded-xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md hover:border-black/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
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
                  <Users className="w-3 h-3" /> Faculty
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" /> Components
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
