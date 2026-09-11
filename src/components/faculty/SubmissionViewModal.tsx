"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, FileText, ShieldCheck, Loader2, Eye } from "lucide-react";
import { formatBytes, forceDownload } from "@/lib/utils";

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
  component_name: string;
  section_name: string;
  status: string;
  baseUrl: string;
};

function getPreviewData(fileKey: string, baseUrl: string) {
  const ext = fileKey.split(".").pop()?.toLowerCase() || "";
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isOffice = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);

  const fileUrl = `${baseUrl}/${fileKey}`;
  let previewSrc = fileUrl;
  if (isOffice) {
    previewSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }

  return { isPdf, isImage, isOffice, isPreviewable: isPdf || isImage || isOffice, fileUrl, previewSrc };
}

export function FacultySubmissionViewModal({
  submission_id,
  component_name,
  section_name,
  status,
  baseUrl,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const isSubmitted = status === "submitted";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  // Only show for submitted/approved/rejected states
  if (!isSubmitted && !isApproved && !isRejected) {
    return null;
  }

  async function handleOpen() {
    setIsOpen(true);
    setLoading(true);
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

  const currentFile = files[selectedFileIndex];

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset transition-colors cursor-pointer ${
          isApproved
            ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100"
            : isRejected
            ? "bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100"
            : "bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100"
        }`}
        title="View uploaded files"
      >
        {isApproved ? (
          <ShieldCheck className="w-3 h-3" />
        ) : isRejected ? (
          <X className="w-3 h-3" />
        ) : (
          <Eye className="w-3 h-3" />
        )}
        View Files
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
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
                    Section {section_name} ·{" "}
                    <span
                      className={`font-semibold ${
                        isApproved
                          ? "text-green-600"
                          : isRejected
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    >
                      {isApproved
                        ? "Approved"
                        : isRejected
                        ? "Rejected"
                        : "Submitted — Awaiting Review"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {currentFile && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        forceDownload(
                          `${baseUrl}/${currentFile.s3_object_key}`,
                          currentFile.file_name
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}
                  <div className="w-px h-6 bg-black/10 mx-2" />
                  <button
                    onClick={() => setIsOpen(false)}
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
                    <div className="text-center">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No files found for this submission.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* File tabs (shown when multiple files) */}
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

                    {/* File metadata bar */}
                    {currentFile && (
                      <div className="flex items-center gap-3 bg-white border-b border-black/5 px-4 py-2 shrink-0 text-xs text-gray-500">
                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700 truncate">
                          {currentFile.file_name}
                        </span>
                        <span className="shrink-0">{formatBytes(currentFile.file_size)}</span>
                        <span className="shrink-0">
                          Uploaded{" "}
                          {new Date(currentFile.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden relative">
                      {currentFile &&
                        (() => {
                          const { isImage, isPreviewable, previewSrc } = getPreviewData(
                            currentFile.s3_object_key,
                            baseUrl
                          );

                          if (!isPreviewable) {
                            return (
                              <div className="flex h-full flex-col items-center justify-center gap-2">
                                <FileText className="w-10 h-10 text-gray-300" />
                                <p className="text-sm text-gray-500">
                                  Preview not available for this file type.
                                </p>
                                <p className="text-xs text-gray-400">
                                  Please download the file to view it.
                                </p>
                              </div>
                            );
                          }

                          if (isImage) {
                            return (
                              <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden p-4">
                                <img
                                  src={previewSrc}
                                  alt={currentFile.file_name}
                                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                />
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
