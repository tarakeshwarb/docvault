import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

type PendingFaculty = {
  faculty_name: string;
  email: string;
  course_code: string;
  course_name: string;
  section_name: string;
  component_name: string;
  deadline: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { offering_id } = await req.json();

    if (!offering_id) {
      return NextResponse.json({ error: "offering_id is required" }, { status: 400 });
    }

    // Get all pending submissions with faculty emails
    const pending = await queryDb<PendingFaculty>(`
      SELECT
        f.faculty_name,
        f.email,
        cm.course_code,
        cm.course_name,
        sec.section_name,
        cmp.component_name,
        cc.deadline
      FROM public.submission s
      JOIN public.faculty_assignment fa ON s.faculty_assignment_id = fa.id
      JOIN public.faculty f ON fa.faculty_id = f.faculty_id
      JOIN public.section_master sec ON fa.section_id = sec.section_id
      JOIN public.course_component cc ON s.course_component_id = cc.id
      JOIN public.component_master cmp ON cc.component_id = cmp.component_id
      JOIN public.course_offering co ON fa.offering_id = co.offering_id
      JOIN public.course_master cm ON co.course_id = cm.course_id
      WHERE fa.offering_id = $1 AND s.status = 'pending'
      ORDER BY f.email, cmp.component_name
    `, [offering_id]);

    if (pending.length === 0) {
      return NextResponse.json({ message: "No pending submissions found.", sent: 0 });
    }

    // Group by faculty email
    const byFaculty = pending.reduce((acc, row) => {
      if (!acc.has(row.email)) {
        acc.set(row.email, { faculty_name: row.faculty_name, items: [] });
      }
      acc.get(row.email)!.items.push(row);
      return acc;
    }, new Map<string, { faculty_name: string; items: PendingFaculty[] }>());

    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    // If no email key, just return what would be sent (dev mode)
    if (!BREVO_API_KEY) {
      return NextResponse.json({
        message: "Dev mode — email not sent. Set BREVO_API_KEY to enable.",
        would_notify: Array.from(byFaculty.keys()),
        sent: 0,
      });
    }

    let sent = 0;

    for (const [email, { faculty_name, items }] of byFaculty) {
      const itemsList = items.map(item =>
        `<li><strong>${item.component_name}</strong> — ${item.course_code} Section ${item.section_name}${item.deadline ? ` (Deadline: ${new Date(item.deadline).toLocaleDateString()})` : ""}</li>`
      ).join("");

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0c4da2; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">CourseFlow — Pending Submission Reminder</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Dear <strong>${faculty_name}</strong>,</p>
            <p>This is a reminder that you have <strong>${items.length} pending submission${items.length > 1 ? "s" : ""}</strong> that require your attention:</p>
            <ul style="padding-left: 20px; line-height: 2;">
              ${itemsList}
            </ul>
            <p>Please log in to the CourseFlow portal and upload the required documents at the earliest.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://docvault-rho.vercel.app"}/faculty"
               style="display: inline-block; background: #0c4da2; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; margin-top: 8px;">
              Go to My Dashboard
            </a>
            <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
              This is an automated reminder from the CourseFlow Academic Portal.
            </p>
          </div>
        </div>
      `;

      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "CourseFlow", email: "noreply@coursevault.srmist.edu.in" },
            to: [{ email, name: faculty_name }],
            subject: `Reminder: ${items.length} Pending Submission${items.length > 1 ? "s" : ""} — CourseFlow`,
            htmlContent,
          }),
        });

        if (res.ok) sent++;
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err);
      }
    }

    return NextResponse.json({
      message: `Reminders sent to ${sent} faculty member${sent !== 1 ? "s" : ""}.`,
      sent,
      total_pending: pending.length,
    });

  } catch (err) {
    console.error("Send reminders error:", err);
    return NextResponse.json({ error: "Failed to send reminders." }, { status: 500 });
  }
}