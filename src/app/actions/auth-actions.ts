"use server";

import { redirect } from "next/navigation";

import { queryDb } from "@/lib/db";
import {
  clearFacultySession,
  getDashboardPathForRole,
  setFacultySession,
  type FacultySession,
} from "@/lib/auth";

type FacultyAuthRow = {
  faculty_id: number;
  faculty_name: string;
  designation: string;
  email: string;
  role: "admin" | "hod" | "course_coordinator" | "faculty";
};

export type LoginState = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

const initialState: LoginState = {
  ok: false,
  message: "",
};

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function resolvePortalPath(faculty_id: number, role: FacultyAuthRow["role"]): Promise<string> {
  // Special hardcoded override
  if (Number(faculty_id) === 100174) {
    return "/audit";
  }

  // Admin always goes directly to the admin portal based on the role column
  if (role === "admin") {
    return "/admin";
  }

  // For faculty role, check assignment tables to decide the correct portal
  if (role === "faculty") {
    // Check coordinator_assignment first — if assigned as primary coordinator, open coordinator portal
    const coordinatorRows = await queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.coordinator_assignment WHERE faculty_id = $1`,
      [faculty_id]
    );
    if (Number(coordinatorRows[0]?.count ?? 0) > 0) {
      return "/course-coordinator";
    }

    // Check secondary_coordinator_assignment — if assigned as secondary coordinator, open secondary coordinator portal
    try {
      const secondaryCoordinatorRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.secondary_coordinator_assignment WHERE faculty_id = $1`,
        [faculty_id]
      );
      if (Number(secondaryCoordinatorRows[0]?.count ?? 0) > 0) {
        return "/secondary-coordinator";
      }
    } catch (error) {
      // Table doesn't exist yet, skip secondary coordinator check
      console.warn("secondary_coordinator_assignment table not found, skipping check");
    }

    // Check audit_assignment — if assigned as audit professor, open audit portal
    try {
      const auditRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.audit_assignment WHERE faculty_id = $1`,
        [faculty_id]
      );
      if (Number(auditRows[0]?.count ?? 0) > 0) {
        return "/audit";
      }
    } catch (error) {
      // Table doesn't exist yet, skip audit check
      console.warn("audit_assignment table not found, skipping check");
    }

    // Check faculty_assignment — if assigned, open faculty portal
    const facultyRows = await queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.faculty_assignment WHERE faculty_id = $1`,
      [faculty_id]
    );
    if (Number(facultyRows[0]?.count ?? 0) > 0) {
      return "/faculty";
    }

    // Fallback: no assignment found yet, still open faculty portal
    return "/faculty";
  }

  // For all other roles (hod, course_coordinator) use the standard mapping
  return getDashboardPathForRole(role);
}

export async function loginFaculty(
  _prevState: LoginState = initialState,
  formData: FormData
): Promise<LoginState> {
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");
  const requestedRole = readField(formData, "role") as FacultySession["role"];

  if (!email || !password || !requestedRole) {
    return {
      ok: false,
      message: "Enter your faculty email, password, and select a role.",
    };
  }

  let matched: FacultyAuthRow | null = null;

  try {
    const faculty = await queryDb<FacultyAuthRow>(
      `SELECT faculty_id, faculty_name, designation, email, role
       FROM public.faculty
       WHERE lower(email) = $1
       LIMIT 1`,
      [email]
    );
    matched = faculty[0] ?? null;
  } catch (error) {
    return {
      ok: false,
      message: "Unable to verify faculty record right now.",
    };
  }

  if (!matched) {
    return {
      ok: false,
      message: "No faculty account matches that email.",
    };
  }

  // Password verification: password must match the faculty email
  if (password.toLowerCase() !== matched.email.toLowerCase()) {
    return {
      ok: false,
      message: "Invalid password. Please try again.",
    };
  }

  // Validate if the user is allowed to assume the requested role.
  // Admins bypass all checks — anyone else must prove they have the role.
  if (matched.role !== "admin") {
    if (requestedRole === "admin") {
      // Non-admin user trying to log in as admin — deny immediately.
      return { ok: false, message: "You do not have Admin privileges." };
    } else if (requestedRole === "hod" && matched.role !== "hod") {
      return { ok: false, message: "You are not assigned as HOD." };
    } else if (requestedRole === "course_coordinator") {
      const rows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.coordinator_assignment WHERE faculty_id = $1`,
        [matched.faculty_id]
      );
      if (Number(rows[0]?.count ?? 0) === 0) {
        return { ok: false, message: "You are not assigned as a Course Coordinator." };
      }
    } else if (requestedRole === "secondary_coordinator") {
      try {
        const rows = await queryDb<{ count: string }>(
          `SELECT COUNT(*) AS count FROM public.secondary_coordinator_assignment WHERE faculty_id = $1`,
          [matched.faculty_id]
        );
        if (Number(rows[0]?.count ?? 0) === 0) {
          return { ok: false, message: "You are not assigned as a Secondary Coordinator." };
        }
      } catch (e) {
        return { ok: false, message: "Secondary coordinator verification failed." };
      }
    } else if (requestedRole === "faculty") {
      const rows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.faculty_assignment WHERE faculty_id = $1`,
        [matched.faculty_id]
      );
      if (Number(rows[0]?.count ?? 0) === 0) {
        return { ok: false, message: "You are not assigned to any courses as Faculty." };
      }
    } else if (requestedRole === "audit") {
      if (matched.faculty_id !== 100174) {
        try {
          const rows = await queryDb<{ count: string }>(
            `SELECT COUNT(*) AS count FROM public.audit_assignment WHERE faculty_id = $1`,
            [matched.faculty_id]
          );
          if (Number(rows[0]?.count ?? 0) === 0) {
            return { ok: false, message: "You do not have Audit privileges." };
          }
        } catch (e) {
          return { ok: false, message: "Audit verification failed." };
        }
      }
    }
  }

  // The actual role the session uses should be the requested one!
  const effectiveSession = {
    faculty_id: matched.faculty_id,
    faculty_name: matched.faculty_name,
    designation: matched.designation,
    email: matched.email,
    role: requestedRole,
  };

  await setFacultySession(effectiveSession);

  // Directly route to the role's dashboard (no guessing needed)
  const redirectTo = getDashboardPathForRole(requestedRole);

  return {
    ok: true,
    message: "Login successful.",
    redirectTo,
  };
}

export async function logoutFaculty() {
  await clearFacultySession();
  redirect("/");
}