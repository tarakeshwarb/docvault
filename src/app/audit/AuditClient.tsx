"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
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
  Download,
} from "lucide-react";
import type { AuditFacultySubmission } from "./actions";

// ── File Preview Modal ────────────────────────────────────────────────────────

function FilePreviewModal({
  fileName,
  fileUrl,
  onClose,
}: {
  fileName: string;
  fileUrl: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const ext = fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isOffice = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);
  const isPreviewable = isPdf || isImage || isOffice;

  const previewSrc = isOffice
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    : fileUrl;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-[var(--color-ink)] truncate max-w-xl">{fileName}</h3>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Preview Body */}
        <div className="flex-1 bg-gray-50/50 p-4 overflow-hidden flex flex-col">
          {isImage ? (
            <div className="flex-1 flex items-center justify-center">
              <img src={fileUrl} alt={fileName} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
            </div>
          ) : isPreviewable ? (
            <iframe
              src={previewSrc}
              className="w-full h-full border-0 rounded-lg shadow-sm bg-white"
              title="Document Preview"
              allowFullScreen
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
              <FileText className="w-12 h-12" />
              <p className="text-sm">Preview not available for this file type.</p>
              <a
                href={fileUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent)]/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── File Link with Preview ────────────────────────────────────────────────────

function PreviewableFileLink({
  file,
}: {
  file: { file_id: string; file_name: string; version: number; file_url: string };
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setPreviewOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline mr-4"
      >
        <FileText className="w-3.5 h-3.5" />
        {file.file_name}
        <span className="text-gray-400">v{file.version}</span>
      </button>
      {previewOpen && (
        <FilePreviewModal
          fileName={file.file_name}
          fileUrl={file.file_url}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type ComponentEntry = {
  submission_id: string;
  component_name: string;
  status: "pending" | "submitted" | "unsubmitted" | null;
  submitted_at: string | null;
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
          files: [],
        });
      }
      const comp = entry.compMap.get(row.submission_id)!;
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
    const pendingCount = components.filter((c) => c.status === "pending" || c.status === null).length;
    return { ...meta, components, submittedCount, unsubmittedCount, pendingCount };
  });
}

// ── Status Badge ─────────────────────────────────────────────────────────────

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

function FacultyCard({ group }: { group: FacultyGroup }) {
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
                  <div className="min-w-0">
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

                    {/* Files */}
                    {comp.files.length > 0 && (
                      <div className="mt-2 ml-5 flex flex-wrap gap-1">
                        {comp.files.map((f) => (
                          <PreviewableFileLink key={f.file_id} file={f} />
                        ))}
                      </div>
                    )}

                    {comp.status === "unsubmitted" && (
                      <p className="mt-1 ml-5 text-xs text-red-500 font-medium">
                        ⚠ Files were deleted by faculty after submission.
                      </p>
                    )}
                  </div>
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

export default function AuditClient({ initialRows }: { initialRows: AuditFacultySubmission[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "submitted" | "unsubmitted" | "pending">("");

  const groups = useMemo(() => groupRows(initialRows), [initialRows]);

  const uniqueYears = useMemo(() => Array.from(new Set(groups.map((g) => g.year_name))), [groups]);
  const uniqueSemesters = useMemo(() => Array.from(new Set(groups.map((g) => g.semester_name))), [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        !searchTerm ||
        g.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.section_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesYear = !yearFilter || g.year_name === yearFilter;
      const matchesSemester = !semesterFilter || g.semester_name === semesterFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "submitted" && g.submittedCount > 0) ||
        (statusFilter === "unsubmitted" && g.unsubmittedCount > 0) ||
        (statusFilter === "pending" && g.pendingCount > 0);

      return matchesSearch && matchesYear && matchesSemester && matchesStatus;
    });
  }, [groups, searchTerm, yearFilter, semesterFilter, statusFilter]);

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
          <h1 className="mt-2 text-3xl font-semibold">Master Action Trail</h1>
          <p className="mt-1 text-sm text-white/70">
            Per-faculty submission status across all components and sections.
          </p>
        </div>
      </div>

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
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] bg-white min-w-[120px]"
          >
            <option value="">All Years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] bg-white min-w-[140px]"
          >
            <option value="">All Semesters</option>
            {uniqueSemesters.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] bg-white min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Has Submissions</option>
            <option value="unsubmitted">Has Deletions</option>
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
            <FacultyCard key={group.assignment_id} group={group} />
          ))
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        Showing {filteredGroups.length} of {totalFaculty} faculty assignments
      </p>
    </div>
  );
}
