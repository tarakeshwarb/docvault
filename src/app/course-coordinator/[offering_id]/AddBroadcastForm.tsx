"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { UploadCloud, Loader2, X, Plus } from "lucide-react";
import { addCourseBroadcast } from "../actions";
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

export function AddBroadcastForm({
  offering_id,
  faculty_id,
}: {
  offering_id: string;
  faculty_id: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setStagedFile(null);
      setTitle("");
      setError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Invalid file type.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(`File is too large.`);
      return;
    }

    setStagedFile(file);
    if (!title) {
      // default title to file name without extension
      setTitle(file.name.split('.').slice(0, -1).join('.'));
    }
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stagedFile || !title) return;

    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: stagedFile.name,
          content_type: stagedFile.type,
          // Hack to reuse existing upload-url logic without changing backend
          submission_id: "broadcast-" + offering_id,
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
          body: stagedFile,
          headers: { "Content-Type": stagedFile.type },
        });
        if (!uploadRes.ok) throw new Error(`Upload to storage failed.`);
      }

      await addCourseBroadcast({
        offering_id,
        title,
        r2_file_key: r2_object_key,
        file_name: stagedFile.name,
        uploaded_by: faculty_id,
      });

      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-ink)]/90"
      >
        <Plus className="h-4 w-4" />
        Upload Material
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !uploading && setIsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                Broadcast Material
              </h2>
              <button
                onClick={() => !uploading && setIsOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    File Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Course Syllabus"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    File
                  </label>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED_EXTS}
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {stagedFile ? (
                    <div className="flex items-center justify-between rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <UploadCloud className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                        <div className="truncate">
                          <p className="truncate text-sm font-medium text-gray-900" title={stagedFile.name}>
                            {stagedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatBytes(stagedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStagedFile(null);
                          setTitle("");
                        }}
                        className="ml-4 shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => inputRef.current?.click()}
                      className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-8 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors"
                    >
                      <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-[var(--color-accent)]" />
                      <p className="mt-2 text-sm font-medium text-gray-700">Click to browse file</p>
                    </div>
                  )}
                </div>

                {error && <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">{error}</p>}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={uploading}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!stagedFile || !title || uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
