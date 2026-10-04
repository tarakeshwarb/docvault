import { queryDb } from "@/lib/db";
import { MessageSquare, ShieldCheck, CheckCircle2, Clock, XCircle } from "lucide-react";

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

export async function OfficialRemarksTab({ offering_id }: { offering_id: string }) {
  const comments = await getAuditComments(offering_id);

  // Group comments by faculty
  const byFaculty = new Map<string, AuditCommentRow[]>();
  for (const c of comments) {
    if (!byFaculty.has(c.faculty_name)) byFaculty.set(c.faculty_name, []);
    byFaculty.get(c.faculty_name)!.push(c);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--color-accent)]" />
          Official Remarks
        </h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {comments.length === 0 ? (
        <div className="panel-card border-dashed border-gray-300 py-16 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-600">No Official Comments Yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Neither the auditor nor the HOD has left any comments on submissions for this course.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byFaculty.entries()).map(([facultyName, rows]) => (
            <div key={facultyName} className="panel-card overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3 border-b border-black/5 flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 font-semibold text-sm">
                  {facultyName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-medium text-[var(--color-ink)]">{facultyName}</h3>
                <span className="ml-auto text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                  {rows.length} file{rows.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-black/5">
                {rows.map((row) => (
                  <div key={row.submission_id} className="p-5 flex flex-col md:flex-row gap-5">
                    <div className="md:w-1/4 shrink-0 space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                          {row.section_name}
                        </span>
                        <StatusBadge status={row.status} />
                      </div>
                      <p className="font-medium text-sm text-[var(--color-ink)]">{row.component_name}</p>
                      {row.submitted_at && (
                        <p className="text-xs text-gray-500">
                          Sub: {new Date(row.submitted_at).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>

                    <div className="md:w-3/4 space-y-4">
                      {row.audit_remarks && (
                        <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                              A
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                              Auditor Comment
                            </span>
                            <span className="ml-auto text-[10px] text-amber-600/70">
                              by {row.audit_remark_by_name || "Auditor"}
                            </span>
                          </div>
                          <p className="text-sm text-amber-800 leading-relaxed">{row.audit_remarks}</p>
                        </div>
                      )}
                      {row.hod_remarks && (
                        <div className="bg-teal-50/50 rounded-lg p-4 border border-teal-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                              H
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                              HOD Comment
                            </span>
                            <span className="ml-auto text-[10px] text-teal-600/70">
                              by {row.hod_remark_by_name || "HOD"}
                            </span>
                          </div>
                          <p className="text-sm text-teal-800 leading-relaxed">{row.hod_remarks}</p>
                        </div>
                      )}
                    </div>
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
