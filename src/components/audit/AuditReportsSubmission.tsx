"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Trash2,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatBytes, formatDate, forceDownload } from "@/lib/utils";
import {
  type AuditCourseOffering,
  type AuditComponentItem,
  getAuditOfferingComponents,
  deleteAuditComponentReportAction,
} from "@/app/audit/actions";
import { AuditReportUploadModal } from "./AuditReportUploadModal";

export function AuditReportsSubmission({
  courses,
  facultyId,
  isAdmin,
}: {
  courses: AuditCourseOffering[];
  facultyId: number;
  isAdmin: boolean;
}) {
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>(
    courses[0]?.offering_id || ""
  );
  const [components, setComponents] = useState<AuditComponentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeModalComponent, setActiveModalComponent] = useState<AuditComponentItem | null>(null);

  const selectedCourse = courses.find((c) => c.offering_id === selectedOfferingId);

  const loadComponents = useCallback(async () => {
    if (!selectedOfferingId) {
      setComponents([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getAuditOfferingComponents(
        selectedOfferingId,
        isAdmin ? undefined : facultyId
      );
      setComponents(data);
    } catch (err) {
      console.error("Failed to load components:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedOfferingId, facultyId, isAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComponents();
  }, [loadComponents]);

  async function handleDelete(reportId: string, r2Key: string | null) {
    if (!confirm("Are you sure you want to delete this audit report?")) return;
    setDeletingId(reportId);
    try {
      await deleteAuditComponentReportAction(reportId, r2Key);
      await loadComponents();
    } catch {
      alert("Failed to delete report.");
    } finally {
      setDeletingId(null);
    }
  }

  if (courses.length === 0) {
    return (
      <div className="panel-card p-12 text-center text-gray-500">
        <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-3" />
        <h3 className="text-base font-semibold text-[var(--color-ink)]">No Course Offerings Assigned</h3>
        <p className="text-sm text-gray-400 mt-1">
          You currently have no course offerings assigned for compliance audit.
        </p>
      </div>
    );
  }

  const totalComps = components.length;
  const submittedComps = components.filter((c) => !!c.report_id).length;
  const pendingComps = totalComps - submittedComps;

  return (
    <div className="space-y-6">
      {/* Course Selection Tabs / Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            Course Compliance Reports
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Submit an audit report file for each course component to verify compliance.
          </p>
        </div>

        {courses.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
              Select Course:
            </span>
            {courses.map((course) => (
              <button
                key={course.offering_id}
                onClick={() => setSelectedOfferingId(course.offering_id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedOfferingId === course.offering_id
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {course.course_code}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Course Header & Stats */}
      {selectedCourse && (
        <div className="panel-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-accent)]">
                  {selectedCourse.course_code}
                </span>
                <span className="text-xs text-gray-400">
                  {selectedCourse.semester_name} · {selectedCourse.year_name}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-[var(--color-ink)]">
                {selectedCourse.course_name}
              </h3>
            </div>
            <button
              onClick={loadComponents}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50/80 p-3 text-center border border-black/5">
              <p className="text-xs text-gray-500">Components</p>
              <p className="text-xl font-bold text-[var(--color-ink)] mt-0.5">{totalComps}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/50 p-3 text-center border border-emerald-100">
              <p className="text-xs text-emerald-700">Reports Submitted</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{submittedComps}</p>
            </div>
            <div className="rounded-xl bg-amber-50/50 p-3 text-center border border-amber-100">
              <p className="text-xs text-amber-700">Reports Pending</p>
              <p className="text-xl font-bold text-amber-700 mt-0.5">{pendingComps}</p>
            </div>
          </div>
        </div>
      )}

      {/* Components List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : components.length === 0 ? (
        <div className="panel-card p-10 text-center text-gray-500">
          <BookOpen className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm font-medium">No components configured for this course offering yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Course coordinators must first define components (e.g. Lesson Plan, CTs) before reports can be submitted.
          </p>
        </div>
      ) : (
        <div className="panel-card overflow-hidden">
          <div className="border-b border-black/5 px-6 py-4">
            <h4 className="text-sm font-semibold text-[var(--color-ink)]">
              Component Audit Requirements
            </h4>
          </div>

          <div className="divide-y divide-black/5">
            {components.map((comp) => {
              const isSubmitted = !!comp.report_id;
              return (
                <div
                  key={comp.course_component_id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[var(--color-ink)]">
                        {comp.component_name}
                      </span>
                      {comp.mandatory && (
                        <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 uppercase">
                          Required
                        </span>
                      )}
                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending Report
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400">
                      Component Deadline: {comp.deadline ? formatDate(comp.deadline) : "No deadline"}
                    </p>

                    {/* Report File details if submitted */}
                    {isSubmitted && (
                      <div className="mt-2 rounded-xl bg-gray-50 border border-black/5 p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-700 font-medium truncate">
                          <FileText className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                          <span className="truncate" title={comp.file_name || "report"}>
                            {comp.file_name}
                          </span>
                          <span className="text-gray-400 shrink-0">
                            ({formatBytes(comp.file_size)})
                          </span>
                        </div>
                        {comp.submitted_at && (
                          <p className="text-[11px] text-gray-400">
                            Submitted on {formatDate(comp.submitted_at)}
                            {comp.auditor_name && ` by ${comp.auditor_name}`}
                          </p>
                        )}
                        {comp.remarks && (
                          <p className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-black/5">
                            <span className="font-semibold text-gray-700">Audit notes:</span> {comp.remarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {isSubmitted ? (
                      <>
                        {comp.file_url && (
                          <button
                            onClick={() => forceDownload(comp.file_url!, comp.file_name || "audit_report.pdf")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            title="Download audit report"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        )}
                        <button
                          onClick={() => setActiveModalComponent(comp)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 hover:border-[var(--color-accent)]/30 transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(comp.report_id!, comp.r2_file_key)}
                          disabled={deletingId === comp.report_id}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete report"
                        >
                          {deletingId === comp.report_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setActiveModalComponent(comp)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-accent)]/90 transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Submit Report
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload/Update Modal */}
      {activeModalComponent && selectedCourse && (
        <AuditReportUploadModal
          isOpen={!!activeModalComponent}
          onClose={() => setActiveModalComponent(null)}
          onSuccess={loadComponents}
          offeringId={selectedCourse.offering_id}
          courseCode={selectedCourse.course_code}
          courseName={selectedCourse.course_name}
          courseComponentId={activeModalComponent.course_component_id}
          componentName={activeModalComponent.component_name}
          facultyId={facultyId}
          existingReport={
            activeModalComponent.report_id
              ? {
                  report_id: activeModalComponent.report_id,
                  file_name: activeModalComponent.file_name,
                  remarks: activeModalComponent.remarks,
                }
              : null
          }
        />
      )}
    </div>
  );
}
