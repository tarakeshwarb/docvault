import { queryDb } from "@/lib/db";
import { type FacultySession } from "@/lib/auth";

export type UserAssignedRole = {
  role: FacultySession["role"];
  label: string;
  path: string;
};

export async function getUserAssignedRoles(facultyId: number): Promise<UserAssignedRole[]> {
  try {
    // 1. Get the faculty record to check their base role
    const facultyRows = await queryDb<{
      faculty_id: number;
      role: string;
      email: string;
    }>(
      `SELECT faculty_id, role, email FROM public.faculty WHERE faculty_id = $1 LIMIT 1`,
      [facultyId]
    );

    const faculty = facultyRows[0];
    if (!faculty) return [];

    const baseRole = faculty.role;

    // Developer account has access to all roles to switch seamlessly
    if (baseRole === "developer") {
      return [
        { role: "faculty", label: "Faculty", path: "/faculty" },
        { role: "main_coordinator", label: "SOC Coord.", path: "/main-coordinator" },
        { role: "dept_coordinator", label: "Dept Coord.", path: "/dept-coordinator" },
        { role: "hod", label: "HoD/AC/Chair", path: "/hod" },
        { role: "audit", label: "Audit", path: "/audit" },
        { role: "admin", label: "Admin", path: "/admin" },
      ];
    }

    const assigned: UserAssignedRole[] = [];

    // Check Admin
    if (baseRole === "admin") {
      assigned.push({ role: "admin", label: "Admin", path: "/admin" });
    }

    // Check HOD
    if (baseRole === "hod") {
      assigned.push({ role: "hod", label: "HoD/AC/Chair", path: "/hod" });
    }

    // Check SOC (Main Coordinator) Assignment
    try {
      const mainCoordRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.main_coordinator_assignment WHERE faculty_id = $1`,
        [facultyId]
      );
      if (Number(mainCoordRows[0]?.count ?? 0) > 0) {
        assigned.push({ role: "main_coordinator", label: "SOC Coord.", path: "/main-coordinator" });
      }
    } catch {
      // Ignore if table query fails
    }

    // Check Dept Coordinator Assignment
    try {
      const deptCoordRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.dept_coordinator_assignment WHERE faculty_id = $1`,
        [facultyId]
      );
      if (Number(deptCoordRows[0]?.count ?? 0) > 0) {
        assigned.push({ role: "dept_coordinator", label: "Dept Coord.", path: "/dept-coordinator" });
      }
    } catch {
      // Table may not exist yet
    }

    // Check Audit Assignment or special audit ID
    if (facultyId === 100174) {
      assigned.push({ role: "audit", label: "Audit", path: "/audit" });
    } else {
      try {
        const auditRows = await queryDb<{ count: string }>(
          `SELECT COUNT(*) AS count FROM public.audit_assignment WHERE faculty_id = $1`,
          [facultyId]
        );
        if (Number(auditRows[0]?.count ?? 0) > 0) {
          assigned.push({ role: "audit", label: "Audit", path: "/audit" });
        }
      } catch {
        // Table may not exist yet
      }
    }

    // Check Faculty Assignment
    try {
      const facRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.faculty_assignment WHERE faculty_id = $1`,
        [facultyId]
      );
      if (Number(facRows[0]?.count ?? 0) > 0 || baseRole === "faculty") {
        if (!assigned.some((r) => r.role === "faculty")) {
          assigned.push({ role: "faculty", label: "Faculty", path: "/faculty" });
        }
      }
    } catch {
      if (baseRole === "faculty" && !assigned.some((r) => r.role === "faculty")) {
        assigned.push({ role: "faculty", label: "Faculty", path: "/faculty" });
      }
    }

    return assigned;
  } catch (err) {
    console.error("getUserAssignedRoles error:", err);
    return [];
  }
}
