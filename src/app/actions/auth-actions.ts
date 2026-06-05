"use server";

import { redirect } from "next/navigation";

import { queryDb } from "@/lib/db";
import {
  clearFacultySession,
  getDashboardPathForRole,
  setFacultySession,
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
    // Check coordinator_assignment first — if assigned as coordinator, open coordinator portal
    const coordinatorRows = await queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.coordinator_assignment WHERE faculty_id = $1`,
      [faculty_id]
    );
    if (Number(coordinatorRows[0]?.count ?? 0) > 0) {
      return "/course-coordinator";
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

  if (!email || !password) {
    return {
      ok: false,
      message: "Enter your faculty email and password.",
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

  const effectiveSession = {
    faculty_id: matched.faculty_id,
    faculty_name: matched.faculty_name,
    designation: matched.designation,
    email: matched.email,
    role: matched.role,
  };

  await setFacultySession(effectiveSession);

  const redirectTo = await resolvePortalPath(effectiveSession.faculty_id, effectiveSession.role);

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