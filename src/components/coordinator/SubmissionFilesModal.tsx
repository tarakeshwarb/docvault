"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, FileText, CheckCircle2, Clock, ShieldCheck, RotateCcw, Loader2 } from "lucide-react";
import { formatBytes, forceDownload } from "@/lib/utils";
import { approveSubmission, revokeApproval, rejectSubmission } from "@/app/course-coordinator/actions";

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
  readonly?: boolean;
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
  readonly = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const isSubmitted = localStatus === "submitted";
  const isApproved = localStatus === "approved";
  const isRejected = localStatus === "rejected";

  async function handleOpen() {
    setIsOpen(true);
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/submission-files?submission_id=${submission_id}`);
      const data = await res.json();
      const fetchedFiles = data.files ?? [];
      setFiles(fetchedFiles);
      setSelectedFileIndex(fetchedFiles.length > 0 ? fetchedFiles.length - 1 : 0);
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

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setActionError("Please provide a reason for rejection.");
      return;
    }
    setActing(true);
    setActionError(null);
    try {
      await rejectSubmission(submission_id, rejectionReason, offering_id);
      setLocalStatus("rejected");
      setIsRejecting(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to reject.");
    } finally {
      setActing(false);
    }
  }

  // Nothing uploaded yet.
  if (!isSubmitted && !isApproved && !isRejected) {
    return (
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 ring-1 ring-inset ring-gray-500/10">
        <Clock className="w-3 h-3" />
        Pending
      </div>
    );
  }

  const currentFile = files[selectedFileIndex];

  return (
    <>
      {readonly ? (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          View Files
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset transition-colors cursor-pointer ${
            isApproved
              ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100"
              : isRejected
              ? "bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100"
              : "bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100"
          }`}
        >
          {isApproved ? <ShieldCheck className="w-3 h-3" /> : isRejected ? <X className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {isApproved ? "Approved" : isRejected ? "Rejected" : "View Submitted"}
        </button>
      )}

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
                <h2 className="text-base font-semibold text-[var(--color-ink)] flex items-center gap-2">
                  {component_name}
                  {files.length > 1 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                      {files.length} FILES
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {faculty_name} · Section {section_name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {actionError && (
                  <p className="rounded bg-red-50 p-1.5 px-2.5 text-xs font-medium text-red-600">{actionError}</p>
                )}
                {currentFile && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      forceDownload(`${baseUrl}/${currentFile.s3_object_key}`, currentFile.file_name);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
                {!readonly && (
                  <>
                    {isRejecting ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 focus:ring-red-500 focus:border-red-500 min-w-[200px]"
                          autoFocus
                        />
                        <button onClick={() => setIsRejecting(false)} className="text-gray-500 hover:text-gray-700 text-xs font-semibold px-2">Cancel</button>
                        <button onClick={handleReject} disabled={acting || !rejectionReason.trim()} className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
                          {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reject"}
                        </button>
                      </div>
                    ) : isApproved || isRejected ? (
                      <button
                        onClick={handleRevoke}
                        disabled={acting}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        {isRejected ? "Revoke Rejection" : "Revoke Approval"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsRejecting(true)}
                          disabled={acting || files.length === 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 text-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={handleApprove}
                          disabled={acting || files.length === 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          Approve
                        </button>
                      </>
                    )}
                  </>
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

            {/* Body */}
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
                <div className="flex flex-col h-full overflow-hidden">
                  {files.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto bg-white border-b border-black/5 px-4 py-2 shrink-0">
                      {files.map((f, i) => (
                        <button
                          key={f.file_id}
                          onClick={() => setSelectedFileIndex(i)}
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                            selectedFileIndex === i
                              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="max-w-[150px] truncate">{f.file_name}</span>
                          <span className="text-[10px] text-gray-400">v{f.version}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex-1 overflow-hidden relative">
                    {(() => {
                      const { isImage, isPreviewable, previewSrc } = getPreviewData(currentFile.s3_object_key, baseUrl);
                      
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
                            <img src={previewSrc} alt={currentFile.file_name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
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
                    })()}
                  </div>
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
