"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  BookOpen,
  X,
  Download,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Eye,
  ArrowLeft,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import type { HodDetailedSubmission, HodAuditReport } from "../actions";
import { saveHodRemark } from "../actions";
import { GlobalResultAnalysis } from "@/components/coordinator/GlobalResultAnalysis";
import { SubmissionFilesModal } from "@/components/coordinator/SubmissionFilesModal";
import { forceDownload } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ComponentEntry = {
  submission_id: string;
  component_name: string;
  status: "pending" | "submitted" | "unsubmitted" | "rejected" | null;
  submitted_at: string | null;
  hod_remarks: string | null;
  files: { file_id: string; file_name: string; version: number; file_url: string }[];
};

type FacultyGroup = {
  assignment_id: string;
  faculty_id: number;
  faculty_name: string;
  section_name: string;
  batch: number;
  components: ComponentEntry[];
  submittedCount: number;
  unsubmittedCount: number;
  pendingCount: number;
};

// ── Group rows ────────────────────────────────────────────────────────────────

function groupRows(rows: HodDetailedSubmission[]): FacultyGroup[] {
  const map = new Map<string, { meta: any; compMap: Map<string, ComponentEntry> }>();
  for (const row of rows) {
    if (!map.has(row.assignment_id)) {
      map.set(row.assignment_id, {
        meta: {
          assignment_id: row.assignment_id,
          faculty_id: row.faculty_id,
          faculty_name: row.faculty_name,
          section_name: row.section_name,
          batch: row.batch,
        },
        compMap: new Map(),
      });
    }
    const entry = map.get(row.assignment_id)!;
    if (row.submission_id && row.component_name) {
      if (!entry.compMap.has(row.submission_id)) {
        entry.compMap.set(row.submission_id, {
          submission_id: row.submission_id,
          component_name: row.component_name,
          status: row.status as any,
          submitted_at: row.submitted_at,
          hod_remarks: row.hod_remarks,
          files: [],
        });
      }
      const comp = entry.compMap.get(row.submission_id)!;
      if (row.file_id && row.file_name && row.file_url) {
        if (!comp.files.find((f) => f.file_id === row.file_id)) {
          comp.files.push({
            file_id: row.file_id,
            file_name: row.file_name,
            version: row.version ?? 1,
            file_url: row.file_url,
          });
        }
      }
    }
  }
  return Array.from(map.values()).map(({ meta, compMap }) => {
    const components = Array.from(compMap.values());
    return {
      ...meta,
      components,
      submittedCount: components.filter((c) => c.status === "submitted").length,
      unsubmittedCount: components.filter((c) => c.status === "unsubmitted").length,
      pendingCount: components.filter((c) => c.status === "pending" || c.status === null).length,
    } as FacultyGroup;
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (status === "submitted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Submitted
      </span>
    );
  if (status === "unsubmitted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
        <XCircle className="w-3 h-3" /> Deleted by Faculty
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function HodCommentBox({ submission_id, initialRemark }: { submission_id: string; initialRemark: string | null }) {
  const [remark, setRemark] = useState(initialRemark ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await saveHodRemark(submission_id, remark);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-sm">
      <div className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 uppercase tracking-wider">
        <MessageSquare className="w-3 h-3" /> HOD / Reviewer Comment
      </div>
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          placeholder="Add a remark for the faculty..."
          value={remark}
          onChange={(e) => { setRemark(e.target.value); setSaved(false); }}
          className="flex-1 resize-none rounded-lg border border-teal-200 bg-teal-50/50 px-2.5 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function FacultyCard({
  group,
  baseUrl,
  open,
  onToggle,
}: {
  group: FacultyGroup;
  baseUrl: string;
  open: boolean;
  onToggle: () => void;
}) {
  const overallStatus =
    group.unsubmittedCount > 0 ? "has-deleted"
    : group.submittedCount === group.components.length && group.components.length > 0 ? "all-submitted"
    : group.submittedCount > 0 ? "partial"
    : "pending";
  const ringColor =
    overallStatus === "has-deleted" ? "ring-red-200"
    : overallStatus === "all-submitted" ? "ring-emerald-200"
    : "ring-black/5";
  const bgColor =
    overallStatus === "has-deleted" ? "bg-red-50/20"
    : overallStatus === "all-submitted" ? "bg-emerald-50/10"
    : "bg-white";

  return (
    <div className={`rounded-xl ring-1 overflow-hidden transition-all ${ringColor} ${bgColor}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-4 hover:bg-black/[0.02]"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{group.faculty_name}</p>
            <p className="text-xs text-gray-500 truncate">Section {group.section_name} · Batch {group.batch}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {group.submittedCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />{group.submittedCount}
            </span>
          )}
          {group.unsubmittedCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              <XCircle className="w-3 h-3" />{group.unsubmittedCount}
            </span>
          )}
          {group.pendingCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              <Clock className="w-3 h-3" />{group.pendingCount}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-black/5 divide-y divide-black/5">
          {group.components.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">No components assigned.</p>
          ) : (
            group.components.map((comp) => (
              <div key={comp.submission_id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-[var(--color-ink)]">{comp.component_name}</span>
                      <StatusBadge status={comp.status} />
                    </div>
                    {comp.submitted_at && (
                      <p className="mt-1 text-xs text-gray-400 ml-5">
                        {comp.status === "unsubmitted" ? "Last submitted" : "Submitted"} on{" "}
                        {new Date(comp.submitted_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                    {comp.status && comp.status !== "unsubmitted" && comp.status !== "pending" && (
                      <div className="mt-2 ml-5">
                        <SubmissionFilesModal
                          submission_id={comp.submission_id}
                          faculty_name={group.faculty_name}
                          component_name={comp.component_name}
                          section_name={group.section_name}
                          status={comp.status}
                          offering_id=""
                          baseUrl={baseUrl}
                          readonly={true}
                        />
                      </div>
                    )}
                    {comp.status === "unsubmitted" && (
                      <p className="mt-1 ml-5 text-xs text-red-500 font-medium">⚠ Files were deleted by faculty after submission.</p>
                    )}
                  </div>
                  {comp.submission_id && comp.status !== "pending" && comp.status !== null && (
                    <div className="shrink-0 pt-0.5">
                      <HodCommentBox submission_id={comp.submission_id} initialRemark={comp.hod_remarks} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper for previews ────────────────────────────────────────────────────────

function getPreviewData(fileName: string, fileUrl: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  
  let previewSrc = fileUrl;
  if (isOffice) {
    previewSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }
  
  return { isPdf, isImage, isOffice, isPreviewable: isPdf || isImage || isOffice, previewSrc };
}

// ── Audit Report View Modal ───────────────────────────────────────────────────

function AuditReportModal({ report, onClose }: { report: HodAuditReport; onClose: () => void }) {
  const { isImage, isPreviewable, previewSrc } = report.file_url && report.file_name 
    ? getPreviewData(report.file_name, report.file_url)
    : { isImage: false, isPreviewable: false, previewSrc: "" };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Audit Report</p>
            <h2 className="text-base font-semibold text-[var(--color-ink)] mt-0.5">{report.component_name}</h2>
          </div>
          <div className="flex items-center gap-3">
            {report.file_url && (
              <button
                onClick={() => forceDownload(report.file_url!, report.file_name || "audit_report")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            <div className="w-px h-6 bg-black/10 mx-2" />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="px-6 py-3 border-b border-black/5 flex flex-wrap gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-700">Auditor:</span> {report.auditor_name || "Unknown"}</span>
          <span><span className="font-semibold text-gray-700">Submitted:</span> {new Date(report.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
          {report.remarks && <span><span className="font-semibold text-gray-700">Remarks:</span> {report.remarks}</span>}
        </div>

        {/* File preview */}
        <div className="flex-1 overflow-hidden bg-gray-100/50 rounded-b-2xl flex flex-col relative">
          {report.file_url ? (
            isPreviewable ? (
              isImage ? (
                <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden p-4">
                  <img src={previewSrc} alt={report.file_name || ""} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                </div>
              ) : (
                <iframe
                  src={previewSrc}
                  className="w-full h-full min-h-[500px] border-0 bg-white"
                  title="Audit Report Preview"
                  allowFullScreen
                />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-16">
                <FileCheck className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Preview not available for this file type.</p>
                <p className="text-xs text-gray-400">Please download the file to view it.</p>
                <p className="text-[10px] text-gray-400 mt-1 truncate max-w-xs">{report.file_name}</p>
              </div>
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16">
              <FileText className="w-10 h-10 text-gray-300 mb-1" />
              <p className="text-sm text-gray-500">No file attached to this report.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function HodOfferingClient({
  offeringId,
  courseCode,
  courseName,
  semesterName,
  yearName,
  initialRows,
  auditReports,
  baseUrl,
}: {
  offeringId: string;
  courseCode: string;
  courseName: string;
  semesterName: string;
  yearName: string;
  initialRows: HodDetailedSubmission[];
  auditReports: HodAuditReport[];
  baseUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<"tracking" | "result-analysis" | "reports">("tracking");
  const [searchTerm, setSearchTerm] = useState("");
  const [openFacultyId, setOpenFacultyId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<HodAuditReport | null>(null);

  const facultyGroups = useMemo(() => groupRows(initialRows), [initialRows]);

  const filtered = useMemo(() => {
    if (!searchTerm) return facultyGroups;
    const q = searchTerm.toLowerCase();
    return facultyGroups.filter(
      (g) =>
        g.faculty_name.toLowerCase().includes(q) ||
        g.section_name.toLowerCase().includes(q)
    );
  }, [facultyGroups, searchTerm]);

  const totalTasks = facultyGroups.reduce((a, g) => a + g.components.length, 0);
  const submitted = facultyGroups.reduce((a, g) => a + g.submittedCount, 0);
  const pct = totalTasks > 0 ? Math.round((submitted / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <Link href="/hod" className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to courses
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">{courseCode}</p>
        <h1 className="mt-1 text-3xl font-semibold">{courseName}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{semesterName}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{yearName}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{pct}% complete</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Tasks", value: totalTasks, icon: Clock },
          { label: "Submitted", value: submitted, icon: CheckCircle2 },
          { label: "Pending", value: totalTasks - submitted, icon: AlertCircle },
          { label: "Completion", value: `${pct}%`, icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel-card p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-[var(--color-accent)]/10 shrink-0">
              <Icon className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="text-xl font-bold text-[var(--color-ink)]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal Navigation */}
      <div className="border-b border-black/5">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {([
            { key: "tracking", label: "Course Progress", icon: BookOpen },
            { key: "result-analysis", label: "Result Analysis", icon: BarChart3 },
            { key: "reports", label: "Audit Reports", icon: FileCheck },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === key
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Course Progress tab */}
      {activeTab === "tracking" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Faculty Submissions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search faculty or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] shadow-sm"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="panel-card px-6 py-12 text-center text-gray-500">
              {searchTerm ? `No results for "${searchTerm}".` : "No faculty assignments yet."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((g) => (
                <FacultyCard
                  key={g.assignment_id}
                  group={g}
                  baseUrl={baseUrl}
                  open={openFacultyId === g.assignment_id}
                  onToggle={() =>
                    setOpenFacultyId((prev) =>
                      prev === g.assignment_id ? null : g.assignment_id
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result Analysis tab */}
      {activeTab === "result-analysis" && (
        <div className="panel-card p-6">
          <GlobalResultAnalysis
            courses={[{ offering_id: offeringId, course_code: courseCode, course_name: courseName }]}
          />
        </div>
      )}

      {/* Audit Reports tab */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Audit Reports
          </h2>
          <div className="panel-card overflow-hidden">
            {auditReports.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <FileCheck className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p className="text-sm">No audit reports submitted for this course yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-gray-700">Component</th>
                      <th className="px-5 py-3 font-semibold text-gray-700">Auditor</th>
                      <th className="px-5 py-3 font-semibold text-gray-700">Date</th>
                      <th className="px-5 py-3 font-semibold text-gray-700">Remarks</th>
                      <th className="px-5 py-3 font-semibold text-gray-700 text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditReports.map((report) => (
                      <tr key={report.report_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {report.component_name}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{report.auditor_name || "Unknown"}</td>
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(report.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4">
                          {report.remarks ? (
                            <p className="max-w-[180px] truncate text-gray-600" title={report.remarks}>{report.remarks}</p>
                          ) : (
                            <span className="text-gray-400 italic text-xs">No remarks</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setViewingReport(report)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-[var(--color-accent)] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Report Modal */}
      {viewingReport && <AuditReportModal report={viewingReport} onClose={() => setViewingReport(null)} />}
    </div>
  );
}
