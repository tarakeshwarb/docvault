import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { getDashboardPathForRole, setFacultySession } from "@/lib/auth";

type FacultyAuthRow = {
  faculty_id: number;
  faculty_name: string;
  designation: string;
  email: string;
  role: "admin" | "hod" | "course_coordinator" | "faculty";
};

function readText(value: unknown): string {
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

    // Check faculty_assignment — if assigned as faculty, open faculty portal
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = readText(body?.email).toLowerCase();
    const password = readText(body?.password);

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Enter your faculty email and password." },
        { status: 400 }
      );
    }

    let matched: FacultyAuthRow | null = null;

    try {
      // Verify faculty by email only — password column check to be done against DB value
      const rows = await queryDb<FacultyAuthRow>(
        `SELECT faculty_id, faculty_name, designation, email, role
         FROM public.faculty
         WHERE lower(email) = $1
         LIMIT 1`,
        [email]
      );
      matched = rows[0] ?? null;
    } catch {
      return NextResponse.json(
        { ok: false, message: "Unable to verify faculty record right now." },
        { status: 500 }
      );
    }

    if (!matched) {
      return NextResponse.json(
        { ok: false, message: "No faculty account matches that email." },
        { status: 404 }
      );
    }

    // Password verification: password must match the faculty email
    if (password.toLowerCase() !== matched.email.toLowerCase()) {
      return NextResponse.json(
        { ok: false, message: "Invalid password. Please try again." },
        { status: 401 }
      );
    }

    const session = {
      faculty_id: matched.faculty_id,
      faculty_name: matched.faculty_name,
      designation: matched.designation,
      email: matched.email,
      role: matched.role,
    };

    await setFacultySession(session);

    const dashboardPath = await resolvePortalPath(session.faculty_id, session.role);

    return NextResponse.json({
      ok: true,
      redirectTo: dashboardPath,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { ok: false, message: "Login failed: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}