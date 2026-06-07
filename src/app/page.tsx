import { redirect } from "next/navigation";
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
    <div className="min-h-screen w-full flex">

      {/* Left panel — gradient SRM Blue */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-[#2b4f8c] via-[#2b4f8c] to-[#1e3a6e] flex-col justify-between p-12 overflow-hidden">

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c9a127] to-[#c9a127]/60" />
        <div className="absolute -right-20 top-1/3 w-64 h-64 bg-[#c9a127]/5 rounded-full blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10" style={{ animation: "fade-up 0.6s ease-out" }}>
          {/* Logo mark */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#c9a127] flex items-center justify-center shadow-xl shadow-[#c9a127]/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-white tracking-tight">DocVault</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">SRMIST</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8" style={{ animation: "fade-up 0.6s ease-out 0.1s backwards" }}>
          <div className="w-12 h-1.5 bg-gradient-to-r from-[#c9a127] to-[#c9a127]/60 rounded-full" />
          <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
            Academic Course
            <br />File Management
            <br /><span className="text-[#c9a127]">Portal</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Streamline course file submissions, faculty coordination, and semester documentation — all from one place.
          </p>

          <div className="flex flex-col gap-4 pt-4">
            {[
              "Manage semesters and course offerings",
              "Track faculty assignments and submissions",
              "Generate consolidated audit reports",
            ].map((f) => (
              <div key={f} className="flex items-center gap-4 text-base text-white/80">
                <div className="w-6 h-6 rounded-full bg-[#c9a127]/20 flex items-center justify-center flex-shrink-0 border border-[#c9a127]/30">
                  <div className="w-2 h-2 rounded-full bg-[#c9a127]" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10" style={{ animation: "fade-up 0.6s ease-out 0.2s backwards" }}>
          <p className="text-white/40 text-sm font-medium">
            Department of Computer Science & Engineering
            <br />SRM Institute of Science and Technology
          </p>
        </div>
      </div>

      {/* Right panel — white with subtle pattern */}
      <div className="flex-1 flex flex-col justify-center items-center bg-gradient-to-br from-white via-white to-gray-50 px-6 py-12 relative">
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #2b4f8c 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#2b4f8c] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#2b4f8c]">DocVault</span>
          </div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10" style={{ animation: "fade-up 0.6s ease-out 0.3s backwards" }}>
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2b4f8c]/10 to-[#c9a127]/10 px-4 py-2 border border-[#2b4f8c]/10">
              <div className="w-2 h-2 rounded-full bg-[#c9a127] animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2b4f8c]">Faculty Login</span>
            </div>
            <h2 className="text-4xl font-bold text-[#1c2d45] tracking-tight">Welcome back</h2>
            <p className="text-base text-[#5e6b7f]">Sign in with your institutional email to access the portal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <FacultyLoginForm />
          </div>

          <p className="text-center text-sm text-[#5e6b7f]/70">
            Trouble signing in? Contact the <span className="text-[#2b4f8c] font-semibold">department admin</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
