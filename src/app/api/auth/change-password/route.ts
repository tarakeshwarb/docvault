import { NextResponse } from "next/server";
import { queryDb, executeDb } from "@/lib/db";
import { getFacultySession, setFacultySession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await getFacultySession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not authenticated." }, { status: 401 });
  }

  const { currentPassword, newPassword, confirmPassword } = (await request.json()) as {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ ok: false, message: "All fields are required." }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ ok: false, message: "New passwords do not match." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, message: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Prevent using the default password (email) as new password
  if (newPassword.toLowerCase() === session.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, message: "You cannot use your email address as your password." },
      { status: 400 }
    );
  }

  // Fetch current hash
  const rows = await queryDb<{ password_hash: string | null }>(
    "SELECT password_hash FROM public.faculty WHERE faculty_id = $1",
    [session.faculty_id]
  );
  const current = rows[0];
  if (!current) {
    return NextResponse.json({ ok: false, message: "Faculty not found." }, { status: 404 });
  }

  // Verify current password
  let currentValid = false;
  if (current.password_hash) {
    currentValid = await bcrypt.compare(currentPassword, current.password_hash);
  } else {
    currentValid = currentPassword.toLowerCase() === session.email.toLowerCase();
  }

  if (!currentValid) {
    return NextResponse.json({ ok: false, message: "Current password is incorrect." }, { status: 401 });
  }

  // Hash and save new password
  const newHash = await bcrypt.hash(newPassword, 10);
  await executeDb(
    "UPDATE public.faculty SET password_hash = $1, must_change_password = FALSE WHERE faculty_id = $2",
    [newHash, session.faculty_id]
  );

  // Re-issue session cookie with must_change_password cleared
  // so the middleware stops blocking portal routes immediately
  await setFacultySession({ ...session, must_change_password: false });

  return NextResponse.json({ ok: true, message: "Password updated successfully." });
}
