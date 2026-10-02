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

    // Check SOC (Main Coordinator) Assignment or base role
    let isMainCoord = baseRole === "main_coordinator";
    if (!isMainCoord) {
      try {
        const mainCoordRows = await queryDb<{ count: string }>(
          `SELECT COUNT(*) AS count FROM public.main_coordinator_assignment WHERE faculty_id = $1`,
          [facultyId]
        );
        if (Number(mainCoordRows[0]?.count ?? 0) > 0) {
          isMainCoord = true;
        }
      } catch {
        try {
          const coordRows = await queryDb<{ count: string }>(
            `SELECT COUNT(*) AS count FROM public.coordinator_assignment WHERE faculty_id = $1`,
            [facultyId]
          );
          if (Number(coordRows[0]?.count ?? 0) > 0) {
            isMainCoord = true;
          }
        } catch {
          // Table may not exist yet
        }
      }
    }
    if (isMainCoord) {
      assigned.push({ role: "main_coordinator", label: "SOC Coord.", path: "/main-coordinator" });
      // Main coordinator also has dept coordinator access
      assigned.push({ role: "dept_coordinator", label: "Dept Coord.", path: "/dept-coordinator" });
    }

    // Check Dept Coordinator Assignment or base role (if not already added as main coord)
    if (!isMainCoord) {
      let isDeptCoord = baseRole === "dept_coordinator";
      if (!isDeptCoord) {
        try {
          const deptCoordRows = await queryDb<{ count: string }>(
            `SELECT COUNT(*) AS count FROM public.dept_coordinator_assignment WHERE faculty_id = $1`,
            [facultyId]
          );
          if (Number(deptCoordRows[0]?.count ?? 0) > 0) {
            isDeptCoord = true;
          }
        } catch {
          try {
            const secRows = await queryDb<{ count: string }>(
              `SELECT COUNT(*) AS count FROM public.secondary_coordinator_assignment WHERE faculty_id = $1`,
              [facultyId]
            );
            if (Number(secRows[0]?.count ?? 0) > 0) {
              isDeptCoord = true;
            }
          } catch {
            // Table may not exist yet
          }
        }
      }
      if (isDeptCoord) {
        assigned.push({ role: "dept_coordinator", label: "Dept Coord.", path: "/dept-coordinator" });
      }
    }

    // Check Audit Assignment or special audit ID or base role
    if (facultyId === 100174 || baseRole === "audit") {
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
      if (Number(facRows[0]?.count ?? 0) > 0 || baseRole === "faculty" || assigned.some((r) => r.role === "dept_coordinator" || r.role === "main_coordinator")) {
        if (!assigned.some((r) => r.role === "faculty")) {
          assigned.push({ role: "faculty", label: "Faculty", path: "/faculty" });
        }
      }
    } catch {
      if (!assigned.some((r) => r.role === "faculty")) {
        assigned.push({ role: "faculty", label: "Faculty", path: "/faculty" });
      }
    }

    // Ensure at least baseRole or faculty is in assigned list
    if (assigned.length === 0) {
      if (baseRole === "dept_coordinator") {
        assigned.push({ role: "dept_coordinator", label: "Dept Coord.", path: "/dept-coordinator" });
      } else if (baseRole === "main_coordinator") {
        assigned.push({ role: "main_coordinator", label: "SOC Coord.", path: "/main-coordinator" });
      } else if (baseRole === "hod") {
        assigned.push({ role: "hod", label: "HoD/AC/Chair", path: "/hod" });
      } else if (baseRole === "admin") {
        assigned.push({ role: "admin", label: "Admin", path: "/admin" });
      } else {
        assigned.push({ role: "faculty", label: "Faculty", path: "/faculty" });
      }
    }

    // Deduplicate by role
    const seen = new Set<string>();
    return assigned.filter((item) => {
      if (seen.has(item.role)) return false;
      seen.add(item.role);
      return true;
    });
  } catch (err) {
    console.error("getUserAssignedRoles error:", err);
    return [];
  }
}
