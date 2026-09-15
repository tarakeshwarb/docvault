"use client";

import { useState, useMemo, useEffect } from "react";
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
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import type { HodDetailedSubmission, HodDeptStats, HodAuditReport } from "./actions";
import { saveHodRemark } from "./actions";

import { forceDownload } from "@/lib/utils";
import { SubmissionFilesModal } from "@/components/coordinator/SubmissionFilesModal";

// Removed FilePreviewModal and PreviewableFileLink in favor of SubmissionFilesModal

// ── Types and Grouping Logic ──────────────────────────────────────────────────

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

type CourseGroup = {
  offering_id: string;
  course_code: string;
  course_name: string;
  semester_name: string;
  year_name: string;
  faculties: FacultyGroup[];
  totalFaculty: number;
  totalComponents: number;
  submittedComponents: number;
  completionPct: number;
};

function groupRows(rows: HodDetailedSubmission[]): CourseGroup[] {
  const courseMap = new Map<string, { meta: any; facultyMap: Map<string, { meta: any; compMap: Map<string, ComponentEntry> }> }>();

  for (const row of rows) {
    // Course Level
    if (!courseMap.has(row.offering_id)) {
      courseMap.set(row.offering_id, {
        meta: {
          offering_id: row.offering_id,
          course_code: row.course_code,
          course_name: row.course_name,
          semester_name: row.semester_name,
          year_name: row.year_name,
        },
        facultyMap: new Map(),
      });
    }

    const courseEntry = courseMap.get(row.offering_id)!;

    // Faculty Level
    if (!courseEntry.facultyMap.has(row.assignment_id)) {
      courseEntry.facultyMap.set(row.assignment_id, {
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

    const facultyEntry = courseEntry.facultyMap.get(row.assignment_id)!;

    // Component Level
    if (row.submission_id && row.component_name) {
      if (!facultyEntry.compMap.has(row.submission_id)) {
        facultyEntry.compMap.set(row.submission_id, {
          submission_id: row.submission_id,
          component_name: row.component_name,
          status: row.status as any,
          submitted_at: row.submitted_at,
          hod_remarks: row.hod_remarks,
          files: [],
        });
      }
      const comp = facultyEntry.compMap.get(row.submission_id)!;
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

  // Build the hierarchical structure
  return Array.from(courseMap.values()).map(({ meta, facultyMap }) => {
    let totalComponents = 0;
    let submittedComponents = 0;

    const faculties = Array.from(facultyMap.values()).map(({ meta: fMeta, compMap }) => {
      const components = Array.from(compMap.values());
      const fSubCount = components.filter((c) => c.status === "submitted").length;
      const fUnsubCount = components.filter((c) => c.status === "unsubmitted").length;
      const fPendCount = components.filter((c) => c.status === "pending" || c.status === "rejected" || c.status === null).length;

      totalComponents += components.length;
      submittedComponents += fSubCount;

      return {
        ...fMeta,
        components,
        submittedCount: fSubCount,
        unsubmittedCount: fUnsubCount,
        pendingCount: fPendCount,
      } as FacultyGroup;
    });

    const completionPct = totalComponents > 0 ? Math.round((submittedComponents / totalComponents) * 100) : 0;

    return {
      ...meta,
      faculties,
      totalFaculty: faculties.length,
      totalComponents,
      submittedComponents,
      completionPct,
    } as CourseGroup;
  });
}

// ── Components ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Submitted
      </span>
    );
  }
  if (status === "unsubmitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
        <XCircle className="w-3 h-3" />
        Deleted by Faculty
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 w-16 sm:w-24 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-7 text-right">{pct}%</span>
    </div>
  );
}

function FacultyCard({ group, baseUrl }: { group: FacultyGroup; baseUrl: string }) {
  const [open, setOpen] = useState(false);

  const overallStatus =
    group.unsubmittedCount > 0
      ? "has-deleted"
      : group.submittedCount === group.components.length && group.components.length > 0
      ? "all-submitted"
      : group.submittedCount > 0
      ? "partial"
      : "pending";

  const bgStyles =
    overallStatus === "has-deleted"
      ? "bg-red-50/30"
      : overallStatus === "all-submitted"
      ? "bg-emerald-50/20"
      : "bg-gray-50/30";

  return (
    <div className={`border-t border-black/5 ${bgStyles} transition-colors`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left gap-4 hover:bg-black/[0.02]"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{group.faculty_name}</p>
            <p className="text-xs text-gray-500 truncate">
              Section {group.section_name} &bull; Batch {group.batch}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {group.submittedCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              {group.submittedCount}
            </span>
          )}
          {group.unsubmittedCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              <XCircle className="w-3 h-3" />
              {group.unsubmittedCount}
            </span>
          )}
          {group.pendingCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              <Clock className="w-3 h-3" />
              {group.pendingCount}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-black/5 divide-y divide-black/5 pl-4 sm:pl-12">
          {group.components.length === 0 ? (
            <p className="px-5 py-3 text-xs text-gray-400 italic">No components assigned yet.</p>
          ) : (
            group.components.map((comp) => (
              <div key={comp.submission_id} className="px-5 py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-[var(--color-ink)]">{comp.component_name}</span>
                    <StatusBadge status={comp.status} />
                  </div>

                  {comp.submitted_at && (
                    <p className="text-[11px] text-gray-400 ml-5.5">
                      {comp.status === "unsubmitted" ? "Last submitted" : "Submitted"} on{" "}
                      {new Date(comp.submitted_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  )}

                  {/* Files Modal */}
                  {comp.status && comp.status !== "unsubmitted" && comp.status !== "pending" && (
                    <div className="mt-2 ml-5.5">
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
                    <p className="mt-1 ml-5.5 text-xs text-red-500 font-medium">
                      ⚠ Files were deleted by faculty after submission.
                    </p>
                  )}

                  {/* HOD Comment Box */}
                  {comp.status === "submitted" && (
                    <div className="mt-3 ml-5.5">
                      <HodCommentBox 
                        submission_id={comp.submission_id} 
                        initialRemark={comp.hod_remarks} 
                      />
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

function CourseCard({ course, baseUrl }: { course: CourseGroup; baseUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl ring-1 ring-gray-200 bg-white overflow-hidden transition-all">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 bg-white hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-ink)] truncate flex items-center gap-2">
              {course.course_code}
              {course.completionPct < 50 && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 uppercase tracking-wider">
                  Needs Attention
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 truncate">{course.course_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:block text-right mr-2">
            <p className="text-xs font-medium text-gray-600 mb-1">{course.totalFaculty} Faculty</p>
            <CompletionBar pct={course.completionPct} />
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-black/5">
          {course.faculties.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">No faculty assigned to this course.</p>
          ) : (
            course.faculties.map((faculty) => <FacultyCard key={faculty.assignment_id} group={faculty} baseUrl={baseUrl} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function HodClient({
  initialStats: stats,
  initialRows,
  auditReports,
  baseUrl,
}: {
  initialStats: HodDeptStats;
  initialRows: HodDetailedSubmission[];
  auditReports: HodAuditReport[];
  baseUrl: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"tracking" | "reports">("tracking");

  const courseGroups = useMemo(() => groupRows(initialRows), [initialRows]);

  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courseGroups;
    const lowerSearch = searchTerm.toLowerCase();
    return courseGroups.filter(
      (c) =>
        c.course_code.toLowerCase().includes(lowerSearch) ||
        c.course_name.toLowerCase().includes(lowerSearch) ||
        c.faculties.some((f) => f.faculty_name.toLowerCase().includes(lowerSearch))
    );
  }, [courseGroups, searchTerm]);

  const atRiskCourses = courseGroups.filter((c) => c.completionPct < 50);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-[28px] bg-[#0c4da2] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          HOD Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Department Overview</h1>
        <p className="mt-1 text-sm text-white/70 max-w-2xl">
          Monitor all course file submissions across your department. View faculty progress
          and identify pending submissions.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Read-only view</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Live data</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Active semester</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Active Courses", value: stats.total_courses, icon: BookOpen },
          { label: "Faculty", value: stats.total_faculty, icon: User },
          { label: "Total Tasks", value: stats.total_submissions, icon: Clock },
          { label: "Submitted", value: stats.submitted_count, icon: CheckCircle2 },
          { label: "Pending", value: stats.pending_count, icon: AlertCircle },
          { label: "Completion", value: `${stats.overall_completion_pct}%`, icon: TrendingUp },
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
          <button
            onClick={() => setActiveTab("tracking")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "tracking"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Course Progress
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "reports"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            Submitted Reports
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      {activeTab === "tracking" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              Course &amp; Faculty Tracking
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search course or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredCourses.length === 0 ? (
              <div className="panel-card px-6 py-12 text-center text-gray-500">
                No courses found matching "{searchTerm}".
              </div>
            ) : (
              filteredCourses.map((course) => <CourseCard key={course.offering_id} course={course} baseUrl={baseUrl} />)
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Official Audit Reports
          </h2>
          <div className="panel-card overflow-hidden">
            {auditReports.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No audit reports have been submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-gray-900">Course</th>
                      <th className="px-5 py-3 font-semibold text-gray-900">Component</th>
                      <th className="px-5 py-3 font-semibold text-gray-900">Auditor</th>
                      <th className="px-5 py-3 font-semibold text-gray-900">Date</th>
                      <th className="px-5 py-3 font-semibold text-gray-900">Remarks</th>
                      <th className="px-5 py-3 font-semibold text-gray-900 text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditReports.map((report) => (
                      <tr key={report.report_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{report.course_code}</p>
                          <p className="text-xs text-gray-500">{report.course_name}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {report.component_name}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{report.auditor_name || "Unknown"}</td>
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(report.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          {report.remarks ? (
                            <p className="max-w-[200px] truncate text-gray-600" title={report.remarks}>
                              {report.remarks}
                            </p>
                          ) : (
                            <span className="text-gray-400 italic">No remarks</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {report.file_url ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                forceDownload(report.file_url!, report.file_name || "audit_report.pdf");
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
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
    </div>
  );
}

// ── HOD Comment Box ─────────────────────────────────────────────────────────

function HodCommentBox({
  submission_id,
  initialRemark,
}: {
  submission_id: string;
  initialRemark: string | null;
}) {
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
        <MessageSquare className="w-3 h-3" />
        HOD / Reviewer Comment
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
          title="Save comment"
          className="inline-flex items-center gap-1 rounded-lg bg-teal-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
