import { redirect } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, FileStack, BarChart3 } from "lucide-react";
import FacultyLoginForm from "@/components/auth/FacultyLoginForm";
import { getDashboardPathForRole, getFacultySession } from "@/lib/auth";
import { queryDb } from "@/lib/db";

async function resolvePortalPath(faculty_id: number, role: "admin" | "hod" | "course_coordinator" | "faculty"): Promise<string> {
  if (Number(faculty_id) === 100174) return "/audit";
  if (role === "admin") return "/admin";
  if (role === "faculty") {
    const coordinatorRows = await queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count 
       FROM public.coordinator_assignment ca
       JOIN public.course_offering co ON ca.offering_id = co.offering_id
       JOIN public.semester_master sm ON co.semester_id = sm.semester_id
       WHERE ca.faculty_id = $1 AND sm.is_active = true`,
      [faculty_id]
    );
    if (Number(coordinatorRows[0]?.count ?? 0) > 0) return "/course-coordinator";
    
    try {
      const secondaryCoordinatorRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count 
         FROM public.secondary_coordinator_assignment sca
         JOIN public.course_offering co ON sca.offering_id = co.offering_id
         JOIN public.semester_master sm ON co.semester_id = sm.semester_id
         WHERE sca.faculty_id = $1 AND sm.is_active = true`,
        [faculty_id]
      );
      if (Number(secondaryCoordinatorRows[0]?.count ?? 0) > 0) return "/secondary-coordinator";
    } catch (error) {
      // Table doesn't exist yet, skip secondary coordinator check
      console.warn("secondary_coordinator_assignment table not found, skipping check");
    }
    
    try {
      const auditRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count 
         FROM public.audit_assignment aa
         JOIN public.course_offering co ON aa.offering_id = co.offering_id
         JOIN public.semester_master sm ON co.semester_id = sm.semester_id
         WHERE aa.faculty_id = $1 AND sm.is_active = true`,
        [faculty_id]
      );
      if (Number(auditRows[0]?.count ?? 0) > 0) return "/audit";
    } catch (error) {
      // Table doesn't exist yet, skip audit check
      console.warn("audit_assignment table not found, skipping check");
    }
    
    const facultyRows = await queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count 
       FROM public.faculty_assignment fa
       JOIN public.course_offering co ON fa.offering_id = co.offering_id
       JOIN public.semester_master sm ON co.semester_id = sm.semester_id
       WHERE fa.faculty_id = $1 AND sm.is_active = true`,
      [faculty_id]
    );
    if (Number(facultyRows[0]?.count ?? 0) > 0) return "/faculty";
    
    return "/faculty";
  }
  return getDashboardPathForRole(role);
}

export default async function LoginPage() {
  const session = await getFacultySession();
  if (session) {
    const dashboardPath = await resolvePortalPath(
      session.faculty_id,
      session.role as "admin" | "hod" | "course_coordinator" | "faculty"
    );
    redirect(dashboardPath);
  }

  return (
    <div className="flex min-h-[calc(100vh-90px)] bg-white text-[var(--color-ink)]">
      {/* Left Column: Form Section */}
      <div className="flex w-full flex-col px-6 py-10 sm:px-12 lg:w-[46%] lg:px-16 xl:px-24">
        {/* Brand lockup */}
        <div className="flex items-center gap-4">
          <Image
            src="/SRM_Institute_of_Science_and_Technology_Logo.svg"
            alt="SRM Institute of Science and Technology"
            width={150}
            height={56}
            priority
            className="h-9 w-auto object-contain"
          />
          <div className="h-8 w-px bg-black/10" />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">CourseFlow</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Academic Portal
            </p>
          </div>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 flex-col justify-center py-12">
          <div className="mx-auto w-full max-w-[380px]">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Faculty &amp; Staff Sign-in
            </span>
            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[var(--color-ink)]">
              Welcome back
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
              Sign in to access your course files, submissions, and accreditation reports.
            </p>

            <div className="mt-8">
              <FacultyLoginForm />
            </div>

            <p className="mt-8 text-xs leading-relaxed text-[var(--color-muted)]">
              Authorised access only. Activity on this portal is logged for IQAC
              audit and compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Branded Panel */}
      <div className="relative hidden overflow-hidden bg-[#0b1f47] lg:flex lg:w-[54%]">
        <Image
          src="/geometric-bg.svg"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
        />
        {/* Brand gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1f47] via-[#0b1f47]/85 to-[var(--color-accent)]/70" />

        <div className="relative z-10 flex flex-col justify-center px-14 py-16 text-white xl:px-20">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-[2.75rem]">
            Academic course file management, simplified.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            A single, secure workspace for faculty submissions, coordinator
            reviews, and accreditation-ready reporting — across every semester.
          </p>

          <div className="mt-12 space-y-6">
            {[
              {
                icon: FileStack,
                title: "Centralised course files",
                body: "Upload, version, and organise every document by course, section, and term.",
              },
              {
                icon: ShieldCheck,
                title: "Audit-ready & secure",
                body: "Role-based access with a complete trail of every action for IQAC compliance.",
              },
              {
                icon: BarChart3,
                title: "Instant reports & exports",
                body: "Generate print-ready Excel registers and accreditation reports in one click.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/65">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
