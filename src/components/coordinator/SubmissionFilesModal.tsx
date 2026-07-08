"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, FileText, CheckCircle2, Clock, ShieldCheck, RotateCcw, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { approveSubmission, revokeApproval } from "@/app/course-coordinator/actions";

type FileItem = {
  file_id: string;
  file_name: string;
  s3_object_key: string;
  file_size: number;
  uploaded_at: string;
  version: number;
};

type Props = {
  submission_id: string;
  faculty_name: string;
  component_name: string;
  section_name: string;
  status: string;
  offering_id: string;
  currentFacultyId?: number;
};

export function SubmissionFilesModal({
  submission_id,
  faculty_name,
  component_name,
  section_name,
  status,
  offering_id,
  currentFacultyId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? "";

  const isSubmitted = localStatus === "submitted";
  const isApproved = localStatus === "approved";

  async function handleOpen() {
    setIsOpen(true);
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/submission-files?submission_id=${submission_id}`);
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!currentFacultyId) {
      setActionError("Could not identify approver.");
      return;
    }
    setActing(true);
    setActionError(null);
    try {
      await approveSubmission(submission_id, currentFacultyId, offering_id);
      setLocalStatus("approved");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to approve.");
    } finally {
      setActing(false);
    }
  }

  async function handleRevoke() {
    setActing(true);
    setActionError(null);
    try {
      await revokeApproval(submission_id, offering_id);
      setLocalStatus("submitted");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to revoke.");
    } finally {
      setActing(false);
    }
  }

  // Nothing uploaded yet.
  if (!isSubmitted && !isApproved) {
    return (
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 ring-1 ring-inset ring-gray-500/10">
        <Clock className="w-3 h-3" />
        Pending
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset transition-colors cursor-pointer ${
          isApproved
            ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100"
            : "bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100"
        }`}
      >
        {isApproved ? <ShieldCheck className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
        {isApproved ? "Approved" : "Submitted"}
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !acting && setIsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-ink)]">
                  {component_name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {faculty_name} · Section {section_name}
                </p>
              </div>
              <button
                onClick={() => !acting && setIsOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-10">
                  No files found for this submission.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {files.length} file{files.length !== 1 ? "s" : ""} uploaded
                  </p>
                  {files.map((file) => {
                    const fileUrl = `${baseUrl}/${file.s3_object_key}`;
                    return (
                      <div
                        key={file.file_id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="rounded-full bg-[var(--color-accent)]/10 p-2 shrink-0">
                            <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                          </div>
                          <div className="truncate">
                            <p className="truncate text-sm font-medium text-gray-900" title={file.file_name}>
                              {file.file_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatBytes(file.file_size)} · v{file.version} · {new Date(file.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={file.file_name}
                          className="ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent)]/90 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer: approval controls */}
            <div className="border-t border-black/5 px-6 py-4">
              {actionError && (
                <p className="mb-2 rounded bg-red-50 p-2 text-xs font-medium text-red-600">{actionError}</p>
              )}
              {isApproved ? (
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <ShieldCheck className="w-4 h-4" /> Approved
                  </span>
                  <button
                    onClick={handleRevoke}
                    disabled={acting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Revoke approval
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Verify the files, then approve.</span>
                  <button
                    onClick={handleApprove}
                    disabled={acting || files.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
