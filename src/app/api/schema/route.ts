import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export async function GET() {
  const res = await queryDb("SELECT column_name FROM information_schema.columns WHERE table_name = 'file_metadata'");
  return NextResponse.json(res);
}
