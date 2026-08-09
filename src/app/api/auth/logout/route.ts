import { NextResponse } from "next/server";
import { clearFacultySession } from "@/lib/auth";

export async function POST() {
  await clearFacultySession();
  return NextResponse.json({ ok: true });
}
