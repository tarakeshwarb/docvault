import { redirect } from "next/navigation";
import Link from "next/link";
import FacultyLoginForm from "@/components/auth/FacultyLoginForm";
import { getDashboardPathForRole, getFacultySession } from "@/lib/auth";
import { queryDb } from "@/lib/db";

async function resolvePortalPath(faculty_id: number, role: "admin" | "hod" | "course_coordinator" | "faculty"): Promise<string> {
  // Special hardcoded override
  if (Number(faculty_id) === 100174) {
    return "/audit";
  }

  if (role === "admin") return "/admin";

  if (role === "faculty") {
    const coordinatorRows = await queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.coordinator_assignment WHERE faculty_id = $1`,
      [faculty_id]
    );
    if (Number(coordinatorRows[0]?.count ?? 0) > 0) return "/course-coordinator";

    return "/faculty";
  }

  return getDashboardPathForRole(role);
}

export default async function LoginPage() {
  const session = await getFacultySession();
  if (session) {
    const dashboardPath = await resolvePortalPath(session.faculty_id, session.role);
    redirect(dashboardPath);
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-[32px] border border-black/5 bg-white/80 p-6 shadow-[0_24px_70px_rgba(12,10,8,0.10)] backdrop-blur lg:grid-cols-[1.3fr_0.7fr] lg:gap-12 xl:grid-cols-[1.4fr_0.6fr] lg:p-8">
        <div className="flex flex-col justify-center space-y-8 pr-4 lg:py-12">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            CourseFlow Platform
          </div>
          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-[var(--color-ink)] sm:text-6xl leading-[1.1]">
              Academic course file management, <span className="text-[var(--color-accent)]">simplified.</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
              Coordinate academic years, semesters, faculty assignments, and consolidated report generation all in one secure, production-ready portal.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#2b4f8c] p-6 sm:p-8 text-white shadow-[0_20px_60px_rgba(43,79,140,0.25)]">
          
          <div className="relative z-10 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
              Faculty login
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm">Welcome back</h2>
            <p className="text-sm text-white/50">Sign in with your faculty email</p>
          </div>
          <div className="relative z-10 mt-4">
            <FacultyLoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
