import { getFacultySession } from "@/lib/auth";
import { getCoordinatorOfferings } from "@/app/dept-coordinator/actions";
import { queryDb } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, MessageSquare, CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AuditCommentRow = {
  submission_id: string;
  faculty_name: string;
  section_name: string;
  component_name: string;
  status: string;
  submitted_at: string | null;
  audit_remarks: string | null;
  audit_remark_by_name: string | null;
  hod_remarks: string | null;
  hod_remark_by_name: string | null;
};

async function getAuditComments(offering_id: string): Promise<AuditCommentRow[]> {
  return queryDb<AuditCommentRow>(
    `
    SELECT
      s.submission_id,
      f.faculty_name,
      fa.section_name,
      cmp.component_name,
      s.status,
      s.submitted_at,
      s.audit_remarks,
      audit_fac.faculty_name AS audit_remark_by_name,
      s.hod_remarks,
      hod_fac.faculty_name AS hod_remark_by_name
    FROM public.submission s
    JOIN public.faculty_assignment fa ON s.faculty_assignment_id = fa.id
    JOIN public.faculty f ON fa.faculty_id = f.faculty_id
    JOIN public.course_component cc ON s.course_component_id = cc.id
    JOIN public.component_master cmp ON cc.component_id = cmp.component_id
    LEFT JOIN public.faculty hod_fac ON s.hod_remark_by = hod_fac.faculty_id
    LEFT JOIN public.faculty audit_fac ON s.audit_remark_by = audit_fac.faculty_id
    WHERE fa.offering_id = $1
      AND (
        (s.audit_remarks IS NOT NULL AND s.audit_remarks <> '') OR
        (s.hod_remarks IS NOT NULL AND s.hod_remarks <> '')
      )
    ORDER BY f.faculty_name, fa.section_name, cmp.component_name
    `,
    [offering_id]
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
        <ShieldCheck className="w-3 h-3" /> Approved
      </span>
    );
  if (status === "submitted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        <CheckCircle2 className="w-3 h-3" /> Submitted
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

export default async function AuditCommentsPage({
  params,
}: {
  params: Promise<{ offering_id: string }>;
}) {
  const { offering_id } = await params;
  const session = await getFacultySession();
  if (!session) return null;

  const offerings = await getCoordinatorOfferings(session.faculty_id);
  const offering = offerings.find((o) => o.offering_id === offering_id);
  if (!offering) notFound();

  const comments = await getAuditComments(offering_id);

  // Group comments by faculty
  const byFaculty = new Map<string, AuditCommentRow[]>();
  for (const c of comments) {
    if (!byFaculty.has(c.faculty_name)) byFaculty.set(c.faculty_name, []);
    byFaculty.get(c.faculty_name)!.push(c);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dept-coordinator/${offering_id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[var(--color-accent)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>
        <div className="rounded-2xl bg-[var(--color-accent)] p-6 text-white shadow-lg shadow-[var(--color-accent)]/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-1 text-xs font-bold text-white ring-1 ring-inset ring-white/30">
              {offering.course_code}
            </span>
            <span className="text-xs font-medium text-white/70">
              {offering.semester_name} · {offering.year_name}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">{offering.course_name}</h1>
          <div className="mt-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-white/70" />
            <p className="text-sm text-white/80">
              Audit Comments — {comments.length} comment{comments.length !== 1 ? "s" : ""} across{" "}
              {byFaculty.size} faculty member{byFaculty.size !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {comments.length === 0 ? (
        <div className="panel-card border-dashed border-gray-300 py-16 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h2 className="font-semibold text-gray-600">No Official Comments Yet</h2>
          <p className="text-sm text-gray-400 mt-1">
            Neither the auditor nor the HOD has left any comments on submissions for this course.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byFaculty.entries()).map(([facultyName, rows]) => (
            <div key={facultyName} className="panel-card overflow-hidden">
              {/* Faculty Header */}
              <div className="bg-gray-50/80 border-b border-black/5 px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[var(--color-accent)]">
                    {facultyName.charAt(facultyName.lastIndexOf(" ") + 1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{facultyName}</p>
                  <p className="text-xs text-gray-500">
                    {rows.length} comment{rows.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Comment Rows */}
              <div className="divide-y divide-black/5">
                {rows.map((row) => (
                  <div key={row.submission_id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--color-ink)]">
                          {row.component_name}
                        </span>
                        <span className="text-xs text-gray-400">· Section {row.section_name}</span>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
                        {row.audit_remarks && (
                          <div className="flex-1 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70 mb-0.5">{row.audit_remark_by_name ? `${row.audit_remark_by_name} (Auditor)` : 'Auditor'}</p>
                              <p className="text-sm text-amber-800 leading-relaxed">{row.audit_remarks}</p>
                            </div>
                          </div>
                        )}
                        {row.hod_remarks && (
                          <div className="flex-1 flex items-start gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2.5">
                            <MessageSquare className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700/70 mb-0.5">{row.hod_remark_by_name ? `${row.hod_remark_by_name} (HoD / Chair / AC)` : 'HoD / Chair / AC'}</p>
                              <p className="text-sm text-teal-800 leading-relaxed">{row.hod_remarks}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {row.submitted_at && (
                      <p className="text-[10px] text-gray-400 shrink-0 mt-1">
                        Submitted{" "}
                        {new Date(row.submitted_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
