import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  // Check if the faculty exists
  const rows = await queryDb<{ faculty_id: string }>(
    "SELECT faculty_id FROM public.faculty WHERE email = $1 LIMIT 1",
    [email]
  );

  // Always respond with 200 to avoid leaking which emails are registered
  if (rows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // TODO: Generate a reset token, store it with an expiry, and send a reset email via mailer.
  // For now this is a stub — the UI shows the success state correctly.
  console.log(`Password reset requested for: ${email}`);

  return NextResponse.json({ ok: true });
}
