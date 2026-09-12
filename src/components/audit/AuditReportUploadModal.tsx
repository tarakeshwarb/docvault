"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Upload, Loader2, X, File as FileIcon, UploadCloud, AlertCircle } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { submitAuditComponentReportAction } from "@/app/audit/actions";

export function AuditReportUploadModal({
  isOpen,
  onClose,
  onSuccess,
  offeringId,
  courseCode,
  courseName,
  courseComponentId,
  componentName,
  facultyId,
  existingReport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  offeringId: string;
  courseCode: string;
  courseName: string;
  courseComponentId: string;
  componentName: string;
  facultyId: number;
  existingReport?: {
    report_id: string;
    file_name: string | null;
    remarks?: string | null;
  } | null;
}) {
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState(existingReport?.remarks || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemarks(existingReport?.remarks || "");
      setStagedFile(null);
      setError(null);
      setIsDragging(false);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, existingReport]);

  function handleFile(file: File) {
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError(`"${file.name}" (${formatBytes(file.size)}) exceeds the 3MB size limit.`);
      return;
    }

    setError(null);
    setStagedFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleSubmit() {
    if (!stagedFile && !existingReport) {
      setError("Please select a report file to upload.");
      return;
    }

    if (stagedFile && stagedFile.size > 3 * 1024 * 1024) {
      setError(`"${stagedFile.name}" exceeds the 3MB limit.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let r2_file_key = "";
      const fileName = stagedFile?.name || existingReport?.file_name || "report.pdf";
      const fileSize = stagedFile?.size || 0;

      if (stagedFile) {
        const fileContentType = stagedFile.type || "application/octet-stream";
        const res = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: stagedFile.name,
            content_type: fileContentType,
            audit_offering_id: offeringId,
            file_size: stagedFile.size,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get upload URL");
        }

        const { upload_url, r2_object_key, dev_mode } = await res.json();
        r2_file_key = r2_object_key;

        if (!dev_mode) {
          const uploadRes = await fetch(upload_url, {
            method: "PUT",
            body: stagedFile,
            headers: { "Content-Type": fileContentType },
          });
          if (!uploadRes.ok) throw new Error(`Upload to storage failed for ${stagedFile.name}`);
        }
      }

      await submitAuditComponentReportAction({
        offering_id: offeringId,
        course_component_id: courseComponentId,
        auditor_faculty_id: facultyId,
        file_name: fileName,
        r2_file_key,
        file_size: fileSize,
        remarks: remarks.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit audit report.");
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !uploading && onClose()}
      />
      <div className="relative z-10 w-[95vw] max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {existingReport ? "Update Audit Report" : "Submit Audit Report"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {courseCode} · {courseName} · <strong className="text-gray-700">{componentName}</strong>
            </p>
          </div>
          <button
            onClick={() => !uploading && onClose()}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Existing report notice */}
          {existingReport && existingReport.file_name && !stagedFile && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
              <span className="font-semibold">Current file:</span> {existingReport.file_name}.
              <span className="text-emerald-600 block mt-0.5">Upload a new file below to replace it, or update notes.</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Report Document (Any format, max 3MB)
            </label>

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 transition-colors ${
                isDragging
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-gray-300 bg-gray-50/50 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5"
              }`}
            >
              <div className="rounded-full bg-white p-2.5 shadow-sm ring-1 ring-black/5 group-hover:ring-[var(--color-accent)]/50 transition-all">
                <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-[var(--color-accent)]" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-700">
                Click to browse file or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-400">
                All file formats supported (PDF, Excel, Word, etc. max 3MB)
              </p>
            </div>

            {/* Staged file display */}
            {stagedFile && (
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                  <div className="truncate">
                    <p className="truncate text-sm font-medium text-gray-900" title={stagedFile.name}>
                      {stagedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatBytes(stagedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setStagedFile(null)}
                  className="ml-4 shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Remarks / Audit feedback */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Audit Notes &amp; Observations (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Lesson plan verified against syllabus; all 45 planned hours accounted for."
              className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 shadow-sm animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span className="flex-1 leading-relaxed">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors p-0.5"
                title="Dismiss error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50/80 px-6 py-4 flex items-center justify-end gap-3 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || (!stagedFile && !existingReport)}
            className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {existingReport ? "Save Changes" : "Submit Report"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
