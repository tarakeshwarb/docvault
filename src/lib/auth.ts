import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export type FacultySession = {
  faculty_id: number;
  faculty_name: string;
  email: string;
  designation: string;
  role: "admin" | "hod" | "course_coordinator" | "faculty";
};

const SESSION_COOKIE_NAME = "courseflow_session";
const SESSION_SECRET = process.env.AUTH_SECRET ?? "courseflow-dev-secret";

function signPayload(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function encodeSession(session: FacultySession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodeSession(token: string): FacultySession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      !parsed ||
      !parsed.faculty_id ||
      typeof parsed.faculty_name !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.designation !== "string" ||
      (parsed.role !== "admin" && parsed.role !== "hod" && parsed.role !== "course_coordinator" && parsed.role !== "faculty")
    ) {
      return null;
    }
    
    return {
      ...parsed,
      faculty_id: Number(parsed.faculty_id)
    } as FacultySession;
  } catch {
    return null;
  }
}

export function getDashboardPathForRole(role: FacultySession["role"]): string {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "course_coordinator") {
    return "/course-coordinator";
  }
  return "/faculty";
}

export async function getFacultySession(): Promise<FacultySession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return decodeSession(token);
}

export async function setFacultySession(session: FacultySession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 5 * 60,
  });
}

export async function clearFacultySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}