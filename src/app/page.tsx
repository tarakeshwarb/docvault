import { redirect } from "next/navigation";
import Image from "next/image";
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
    const dashboardPath = await resolvePortalPath(session.faculty_id, session.role as any);
    redirect(dashboardPath);
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-100px)] lg:min-h-[950px] bg-white text-gray-900">
      {/* Left Column: Form Section */}
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-[45%] sm:px-16 md:px-24 xl:px-32 2xl:px-48">
        <div className="mx-auto w-full max-w-sm">
          
          {/* Header */}
          <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-gray-900">
            Welcome back !
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            Enter to get unlimited access to data & information.
          </p>

          {/* Form */}
          <FacultyLoginForm />

        </div>
      </div>

      {/* Right Column: Graphic Section */}
      <div className="hidden lg:block lg:w-[55%] relative bg-[#0e0a2b] overflow-hidden">
        <Image 
          src="/geometric-bg.svg" 
          alt="Geometric Background"
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
