import { NextRequest, NextResponse } from 'next/server';
import { queryDb, executeDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const files = await queryDb("SELECT file_name, submission_id FROM public.file_metadata");
    const submissions = await queryDb("SELECT s.submission_id, fa.section_name, f.faculty_name, c.component_name FROM public.submission s JOIN public.faculty_assignment fa ON fa.id = s.faculty_assignment_id JOIN public.faculty f ON f.faculty_id = fa.faculty_id JOIN public.course_component c ON c.id = s.course_component_id");
    return NextResponse.json({ files, submissions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Find stale submissions: 'unsubmitted' OR 'submitted' with no actual files
    const stale = await queryDb<{ submission_id: string; status: string }>(
      `SELECT s.submission_id, s.status FROM public.submission s
       WHERE s.status = 'unsubmitted'
          OR (s.status = 'submitted' AND NOT EXISTS (
            SELECT 1 FROM public.file_metadata fm WHERE fm.submission_id = s.submission_id
          ))`
    );

    for (const r of stale) {
      await executeDb(
        "UPDATE public.submission SET status = 'pending', submitted_at = NULL WHERE submission_id = $1",
        [r.submission_id]
      );
    }

    return NextResponse.json({ fixed: stale.length, records: stale });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
