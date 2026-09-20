"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  BookOpen,
  X,
  ShieldCheck,
  FileCheck,
  MessageSquare,
  Save,
  Loader2,
} from "lucide-react";
import type { AuditFacultySubmission, AuditCourseOffering } from "./actions";
import { saveAuditRemark } from "./actions";
import { AuditReportsSubmission } from "@/components/audit/AuditReportsSubmission";
import { SubmissionFilesModal } from "@/components/coordinator/SubmissionFilesModal";
import { GlobalResultAnalysis } from "@/components/coordinator/GlobalResultAnalysis";
import { BarChart3 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ComponentEntry = {
  submission_id: string;
  component_name: string;
  status: "pending" | "submitted" | "unsubmitted" | "approved" | "rejected" | null;
  submitted_at: string | null;
  audit_remarks: string | null;
  files: { file_id: string; file_name: string; version: number; file_url: string }[];
};

type FacultyGroup = {
  assignment_id: string;
  faculty_id: number;
  faculty_name: string;
  course_code: string;
  course_name: string;
  section_name: string;
  batch: number;
  semester_name: string;
  year_name: string;
  department_id: string | null;
  department_name: string | null;
  components: ComponentEntry[];
  submittedCount: number;
  unsubmittedCount: number;
  pendingCount: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function groupRows(rows: AuditFacultySubmission[]): FacultyGroup[] {
  const assignmentMap = new Map<
    string,
    { meta: Omit<FacultyGroup, "components" | "submittedCount" | "unsubmittedCount" | "pendingCount">; compMap: Map<string, ComponentEntry> }
  >();

  for (const row of rows) {
    if (!assignmentMap.has(row.assignment_id)) {
      assignmentMap.set(row.assignment_id, {
        meta: {
          assignment_id: row.assignment_id,
          faculty_id: row.faculty_id,
          faculty_name: row.faculty_name,
          course_code: row.course_code,
          course_name: row.course_name,
          section_name: row.section_name,
          batch: row.batch,
          semester_name: row.semester_name,
          year_name: row.year_name,
          department_id: row.department_id,
          department_name: row.department_name,
        },
        compMap: new Map(),
      });
    }

    const entry = assignmentMap.get(row.assignment_id)!;

    if (row.submission_id && row.component_name) {
      if (!entry.compMap.has(row.submission_id)) {
        entry.compMap.set(row.submission_id, {
          submission_id: row.submission_id,
          component_name: row.component_name,
          status: row.status,
          submitted_at: row.submitted_at,
          audit_remarks: row.audit_remarks ?? null,
          files: [],
        });
      }
      const comp = entry.compMap.get(row.submission_id)!;
      // Update audit_remarks if present (overwrite with latest)
      if (row.audit_remarks) comp.audit_remarks = row.audit_remarks;
      if (row.file_id && row.file_name && row.file_url) {
        // Avoid duplicate file entries (from multiple LEFT JOIN rows)
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

  return Array.from(assignmentMap.values()).map(({ meta, compMap }) => {
    const components = Array.from(compMap.values());
    const submittedCount = components.filter((c) => c.status === "submitted").length;
    const unsubmittedCount = components.filter((c) => c.status === "unsubmitted").length;
    const pendingCount = components.filter((c) => c.status === "pending" || c.status === "rejected" || c.status === null).length;
    return { ...meta, components, submittedCount, unsubmittedCount, pendingCount };
  });
}

// ── Audit Comment Box ────────────────────────────────────────────────────────

function AuditCommentBox({
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
      await saveAuditRemark(submission_id, remark);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs">
      <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
        <MessageSquare className="w-3 h-3" />
        Audit Comment
      </div>
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          placeholder="Add comment for faculty..."
          value={remark}
          onChange={(e) => { setRemark(e.target.value); setSaved(false); }}
          className="flex-1 resize-none rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          title="Save comment"
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}


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

// ── Faculty Card ─────────────────────────────────────────────────────────────

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

  const statusRing =
    overallStatus === "all-submitted"
      ? "ring-emerald-200 bg-emerald-50/30"
      : overallStatus === "has-deleted"
      ? "ring-red-200 bg-red-50/30"
      : overallStatus === "partial"
      ? "ring-amber-200 bg-amber-50/30"
      : "ring-gray-200 bg-white";

  return (
    <div className={`rounded-xl ring-1 transition-all ${statusRing}`}>
      {/* Card Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
            <User className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-ink)] truncate">{group.faculty_name}</p>
            <p className="text-xs text-gray-500 truncate">
              {group.course_code} &bull; Section {group.section_name} &bull; Batch {group.batch} &bull;{" "}
              {group.semester_name}, {group.year_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Summary pills */}
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
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Component List */}
      {open && (
        <div className="border-t border-black/5 divide-y divide-black/5">
          {group.components.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">
              No components assigned yet.
            </p>
          ) : (
            group.components.map((comp) => (
              <div key={comp.submission_id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: component info + view button */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-[var(--color-ink)]">
                        {comp.component_name}
                      </span>
                      <StatusBadge status={comp.status} />
                    </div>

                    {comp.submitted_at && (
                      <p className="mt-1 text-xs text-gray-400 ml-5">
                        {comp.status === "unsubmitted" ? "Last submitted" : "Submitted"} on{" "}
                        {new Date(comp.submitted_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    )}

                    {/* View Files button */}
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
                      <p className="mt-1 ml-5 text-xs text-red-500 font-medium">
                        ⚠ Files were deleted by faculty after submission.
                      </p>
                    )}
                  </div>

                  {/* Right: audit comment box */}
                  {comp.submission_id && comp.status !== "pending" && (
                    <div className="shrink-0 pt-0.5">
                      <AuditCommentBox
                        submission_id={comp.submission_id}
                        initialRemark={comp.audit_remarks}
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function AuditClient({
  initialRows,
  baseUrl,
  auditCourses = [],
  facultyId,
  isAdmin = false,
}: {
  initialRows: AuditFacultySubmission[];
  baseUrl: string;
  auditCourses?: AuditCourseOffering[];
  facultyId: number;
  isAdmin?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"trail" | "result-analysis" | "reports">("trail");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "submitted" | "pending">("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#reports-submission" || window.location.hash === "#reports") {
        setActiveTab("reports");
      } else if (window.location.hash === "#result-analysis") {
        setActiveTab("result-analysis");
      } else {
        setActiveTab("trail");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const groups = useMemo(() => groupRows(initialRows), [initialRows]);


  const uniqueDepartments = useMemo(() => {
    const deptMap = new Map<string, string>();
    for (const g of groups) {
      if (g.department_id && g.department_name) {
        deptMap.set(g.department_id, g.department_name);
      }
    }
    return Array.from(deptMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        !searchTerm ||
        g.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.section_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = !departmentFilter || g.department_id === departmentFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "submitted" && g.submittedCount > 0) ||
        (statusFilter === "pending" && g.pendingCount > 0);

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [groups, searchTerm, statusFilter, departmentFilter]);

  // Stats
  const totalFaculty = groups.length;
  const allSubmitted = groups.filter((g) => g.pendingCount === 0 && g.unsubmittedCount === 0).length;
  const hasDeleted = groups.filter((g) => g.unsubmittedCount > 0).length;
  const hasPending = groups.filter((g) => g.pendingCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between rounded-[28px] bg-[var(--color-accent)] p-6 text-white shadow-[0_18px_50px_rgba(12,77,162,0.18)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            IQAC Audit &amp; Compliance
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {activeTab === "trail" ? "Master Action Trail" : "Reports Submission"}
          </h1>
          <p className="mt-1 text-sm text-white/70">
            {activeTab === "trail"
              ? "Per-faculty submission status across all components and sections."
              : "Submit and manage compliance audit reports for each course component."}
          </p>
        </div>
      </div>

      {/* Horizontal Navigation Tabs */}
      <div className="border-b border-black/5">
        <nav className="-mb-px flex gap-6" aria-label="Audit Tabs">
          <button
            onClick={() => {
              setActiveTab("trail");
              window.history.replaceState(null, "", "#audit-trail");
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "trail"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Audit Trail
          </button>
          <button
            onClick={() => {
              setActiveTab("result-analysis");
              window.history.replaceState(null, "", "#result-analysis");
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "result-analysis"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Result Analysis
          </button>
          <button
            onClick={() => {
              setActiveTab("reports");
              window.history.replaceState(null, "", "#reports-submission");
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "reports"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Reports Submission
          </button>
        </nav>
      </div>

      {/* Tab 1: Master Action Trail */}
      <div className={activeTab === "trail" ? "space-y-6 block animate-in fade-in duration-300" : "hidden"}>


        {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Faculty", value: totalFaculty, color: "text-[var(--color-ink)]" },
          { label: "Fully Submitted", value: allSubmitted, color: "text-emerald-600" },
          { label: "Deleted Files", value: hasDeleted, color: "text-red-600" },
          { label: "Has Pending", value: hasPending, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="panel-card p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="panel-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search faculty, course, or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] bg-white min-w-[140px]"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] bg-white min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Has Submissions</option>
            <option value="pending">Has Pending</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="panel-card px-6 py-12 text-center text-gray-500">
            No faculty records found matching the criteria.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <FacultyCard key={group.assignment_id} group={group} baseUrl={baseUrl} />
          ))
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        Showing {filteredGroups.length} of {totalFaculty} faculty assignments
      </p>
    </div>

    {/* Tab 2: Result Analysis */}
    <div className={activeTab === "result-analysis" ? "space-y-6 block animate-in fade-in duration-300" : "hidden"}>
      <div className="panel-card p-6">
        <GlobalResultAnalysis 
          courses={auditCourses.map(c => ({
            offering_id: c.offering_id,
            course_code: c.course_code,
            course_name: c.course_name
          }))}
        />
      </div>
    </div>

    {/* Tab 3: Reports Submission */}
    <div className={activeTab === "reports" ? "space-y-6 block animate-in fade-in duration-300" : "hidden"}>
      <AuditReportsSubmission
        courses={auditCourses}
        facultyId={facultyId}
        isAdmin={isAdmin}
      />
    </div>
  </div>
);
}
