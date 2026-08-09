import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "courseflow_session";

// Protected portal prefixes — any URL starting with these requires a valid session
const PROTECTED_PREFIXES = [
  "/admin",
  "/faculty",
  "/course-coordinator",
  "/secondary-coordinator",
  "/hod",
  "/audit",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // No session at all → kick to login
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Decode session (no DB call needed — just base64 decode the payload)
  try {
    const [payload] = token.split(".");
    if (!payload) throw new Error("bad token");
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    // If must_change_password is set → force them back to change-password
    if (session?.must_change_password === true) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      url.searchParams.set("forced", "1"); // flag so the page shows a notice
      return NextResponse.redirect(url);
    }
  } catch {
    // Malformed token → kick to login
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/faculty/:path*",
    "/course-coordinator/:path*",
    "/secondary-coordinator/:path*",
    "/hod/:path*",
    "/audit/:path*",
  ],
};
