"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { recordFileUpload, getSubmissionFiles, deleteFileAction, type FileMetadata } from "./actions";
import { Upload, Loader2, CheckCircle2, X, Trash2, File as FileIcon, UploadCloud, Plus } from "lucide-react";
import { formatBytes } from "@/lib/utils";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "application/zip",
];

const ALLOWED_EXTS = ".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.zip";

export function UploadModal({
  submission_id,
  component_name,
  isSubmitted,
}: {
  submission_id: string;
  component_name: string;
  isSubmitted: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [existingFiles, setExistingFiles] = useState<FileMetadata[]>([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setStagedFiles([]);
      setError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  async function loadFiles() {
    setLoadingFiles(true);
    try {
      const files = await getSubmissionFiles(submission_id);
      setExistingFiles(files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFiles(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`Invalid type: ${f.name}`);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        setError(`Too large: ${f.name}`);
        return false;
      }
      return true;
    });

    setStagedFiles((prev) => [...prev, ...validFiles]);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (stagedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of stagedFiles) {
        const res = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: file.name,
            content_type: file.type,
            submission_id,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get upload URL");
        }

        const { upload_url, r2_object_key, dev_mode } = await res.json();

        if (!dev_mode) {
          const uploadRes = await fetch(upload_url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (!uploadRes.ok) throw new Error(`Upload to storage failed for ${file.name}`);
        }

        await recordFileUpload({
          submission_id,
          file_name: file.name,
          r2_object_key,
          file_size: file.size,
        });
      }

      await loadFiles();
      setStagedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(file_id: string, s3_object_key: string) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    setExistingFiles((prev) => prev.filter((f) => f.file_id !== file_id));
    try {
      await deleteFileAction(file_id, submission_id, s3_object_key);
    } catch (err) {
      alert("Failed to delete file");
      loadFiles();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
          isSubmitted
            ? "border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
      >
        {isSubmitted ? (
          <>
            <Upload className="w-3 h-3" />
            Manage Files
          </>
        ) : (
          <>
            <UploadCloud className="w-3 h-3" />
            Upload
          </>
        )}
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !uploading && setIsOpen(false)}
          />
          <div className="relative z-10 w-[95vw] max-w-lg min-h-[500px] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                  {component_name}
                </h2>
                <p className="text-sm text-gray-500">Upload or manage files for this requirement</p>
              </div>
              <button
                onClick={() => !uploading && setIsOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Existing Files */}
              {existingFiles.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Uploaded Files ({existingFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {existingFiles.map((f) => (
                      <div
                        key={f.file_id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="rounded-full bg-green-100 p-2 text-green-600 shrink-0">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <p className="truncate text-sm font-medium text-gray-900" title={f.file_name}>
                              {f.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatBytes(f.file_size)} • Uploaded {new Date(f.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(f.file_id, f.s3_object_key)}
                          className="ml-4 shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Upload Area */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Add New Files
                </h3>

                <input
                  ref={inputRef}
                  type="file"
                  accept={ALLOWED_EXTS}
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div
                  onClick={() => inputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-10 hover:border-[var(--color-accent)] hover:bg-blue-50/50 transition-colors"
                >
                  <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-black/5 group-hover:ring-[var(--color-accent)]/50 transition-all">
                    <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-[var(--color-accent)]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-700">
                    Click to browse files
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, Excel, Word, Image, or ZIP (max 50MB)
                  </p>
                </div>

                {error && <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">{error}</p>}

                {/* Staged Files */}
                {stagedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {stagedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />
                          <div className="truncate">
                            <p className="truncate text-sm font-medium text-gray-900" title={f.name}>
                              {f.name}
                            </p>
                            <p className="text-xs text-gray-500">{formatBytes(f.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeStagedFile(i)}
                          className="ml-4 shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/80 px-6 py-4 flex items-center justify-end gap-3 border-t border-black/5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={uploading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {stagedFiles.length > 0 ? "Cancel" : "Close"}
              </button>
              {stagedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="rounded-lg bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading {stagedFiles.length} file{stagedFiles.length !== 1 ? "s" : ""}...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Submit Files
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
