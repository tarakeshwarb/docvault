import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Building2, ArrowRight } from "lucide-react";
import { getDeptOfferingsForSoc, getCoordinatorOfferings } from "./actions";
import { getFacultySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MainCoordinatorPage() {
  const session = await getFacultySession();
  if (!session) {
    return null;
  }

  const deptOfferings = await getDeptOfferingsForSoc(session.faculty_id);
  const offerings = await getCoordinatorOfferings(session.faculty_id);
  const totalDepartments = deptOfferings.length;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          Main Coordinator Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">SOC Coordinator Dashboard</h1>
        <p className="mt-1 text-sm text-white/70">
          Select a department to view all assigned faculties and track their submission progress.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.length > 0 ? offerings.map(offering => (
            <div key={offering.offering_id} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <BookOpen className="h-4 w-4 text-white/70" />
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/60">{offering.course_code}</p>
              <p className="mt-1 text-lg font-semibold text-white">{offering.course_name}</p>
              <p className="mt-1 text-xs text-white/70">{offering.semester_name} - {offering.year_name}</p>
            </div>
          )) : (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <BookOpen className="h-4 w-4 text-white/70" />
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/60">Courses</p>
              <p className="mt-1 text-lg font-semibold text-white">None Assigned</p>
            </div>
          )}
          
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <Building2 className="h-4 w-4 text-white/70" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/60">Departments</p>
            <p className="mt-1 text-lg font-semibold text-white">{totalDepartments}</p>
          </div>
        </div>
      </div>

      {deptOfferings.length === 0 ? (
        <div className="panel-card border-dashed border-gray-300 p-5 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h2 className="font-semibold text-gray-600">No departments found</h2>
          <p className="text-sm text-gray-400 mt-1">
            There are currently no departments configured in the system.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deptOfferings.map((dept) => {
            const href = dept.offering_id
              ? `/dept-coordinator/${dept.offering_id}`
              : `#`;
            return (
              <Link
                key={dept.department_id}
                href={href}
                className={`panel-card panel-card-hover group p-5 ${!dept.offering_id ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-2 py-1 text-xs font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
                    Dept
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-accent)] transition-colors" />
                </div>
                <h3 className="mt-3 font-semibold text-[var(--color-ink)] leading-snug">
                  {dept.department_name}
                </h3>
                {!dept.offering_id && (
                  <p className="mt-1 text-xs text-gray-400">No offering assigned</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
