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
  baseUrl: string;
  currentFacultyId?: number;
};

function getPreviewData(fileKey: string, baseUrl: string) {
  const ext = fileKey.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  
  const fileUrl = `${baseUrl}/${fileKey}`;
  let previewSrc = fileUrl;
  if (isOffice) {
    previewSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }
  
  return { isPdf, isImage, isOffice, isPreviewable: isPdf || isImage || isOffice, fileUrl, previewSrc };
}

export function SubmissionFilesModal({
  submission_id,
  faculty_name,
  component_name,
  section_name,
  status,
  offering_id,
  baseUrl,
  currentFacultyId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
          <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white shadow-2xl flex flex-col h-[90vh]">
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
              <div className="flex items-center gap-3">
                {actionError && (
                  <p className="rounded bg-red-50 p-1.5 px-2.5 text-xs font-medium text-red-600">{actionError}</p>
                )}
                {files.length > 0 && (
                  <a
                    href={`${baseUrl}/${files[files.length - 1].s3_object_key}`}
                    target="_blank"
                    rel="noreferrer"
                    download={files[files.length - 1].file_name}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
                {isApproved ? (
                  <button
                    onClick={handleRevoke}
                    disabled={acting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Revoke Approval
                  </button>
                ) : (
                  <button
                    onClick={handleApprove}
                    disabled={acting || files.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Approve
                  </button>
                )}
                <div className="w-px h-6 bg-black/10 mx-2" />
                <button
                  onClick={() => !acting && setIsOpen(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: Direct Preview */}
            <div className="flex-1 overflow-hidden bg-gray-100/50 rounded-b-2xl flex flex-col relative">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : files.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-gray-500">No files found for this submission.</p>
                </div>
              ) : (
                (() => {
                  const latestFile = files[files.length - 1];
                  const { isImage, isPreviewable, previewSrc } = getPreviewData(latestFile.s3_object_key, baseUrl);
                  
                  if (!isPreviewable) {
                    return (
                      <div className="flex h-full flex-col items-center justify-center gap-2">
                        <FileText className="w-10 h-10 text-gray-300" />
                        <p className="text-sm text-gray-500">Preview not available for this file type.</p>
                        <p className="text-xs text-gray-400">Please download the file to view it.</p>
                      </div>
                    );
                  }
                  
                  if (isImage) {
                    return (
                      <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden p-4">
                        <img src={previewSrc} alt={latestFile.file_name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                      </div>
                    );
                  }
                  
                  return (
                    <iframe
                      src={previewSrc}
                      className="w-full h-full border-0 bg-white"
                      title="Document Preview"
                      allowFullScreen
                    />
                  );
                })()
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
