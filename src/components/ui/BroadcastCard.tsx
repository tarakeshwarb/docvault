"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ConfirmDownloadLink } from "./ConfirmDownloadLink";
import { Eye, Download, X, Trash2, Loader2 } from "lucide-react";
import { deleteCourseBroadcast } from "@/app/course-coordinator/actions";
import { formatDate } from "@/lib/utils";

export type BroadcastProps = {
  broadcast_id: string;
  r2_file_key: string;
  title: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: string;
  course_code: string;
  offering_id: string;
};

export function BroadcastCard({ broadcast: b, baseUrl, currentFacultyId }: { broadcast: BroadcastProps; baseUrl: string; currentFacultyId?: number }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const fileUrl = `${baseUrl}/${b.r2_file_key}`;

  // Determine if file is previewable by Google Docs Viewer (docx, xlsx, pptx) or native (pdf)
  const ext = b.r2_file_key.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  const isPreviewable = isPdf || isImage || isOffice;

  let previewSrc = fileUrl;
  if (isOffice) {
    // using office apps embed viewer for docx/xlsx/pptx
    previewSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }

  return (
    <>
      <div className="panel-card flex flex-col justify-between p-4 hover:border-[var(--color-accent)] hover:shadow-md transition-all bg-white h-full">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
              {b.course_code}
            </span>
            {currentFacultyId && b.uploaded_by != null && String(b.uploaded_by) === String(currentFacultyId) && (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 disabled:opacity-50"
                title="Delete Broadcast"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-2" title={b.title}>
            {b.title}
          </h3>
          <p className="mt-1 text-[11px] text-gray-500">
            Uploaded by {b.uploaded_by_name ?? "System"} on {formatDate(b.created_at)}
          </p>
        </div>
        
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          {isPreviewable ? (
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center justify-center gap-1.5 flex-1 rounded-lg bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          ) : (
            <div className="flex-1 text-[10px] text-gray-400 text-center italic">
              No preview
            </div>
          )}
          <ConfirmDownloadLink
            href={fileUrl}
            target="_blank"
            className="flex items-center justify-center gap-1.5 flex-1 rounded-lg bg-[var(--color-accent)]/10 py-2 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </ConfirmDownloadLink>
        </div>
      </div>

      {mounted && isPreviewOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[80vw] h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-[var(--color-ink)] truncate max-w-xl">{b.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{b.course_code}</p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-50/50 p-4 relative overflow-hidden flex flex-col">
              {isImage ? (
                <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden">
                  <img src={fileUrl} alt={b.title} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                </div>
              ) : (
                <iframe
                  src={previewSrc}
                  className="w-full h-full border-0 rounded-lg shadow-sm bg-white"
                  title="Document Preview"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && isDeleteConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Broadcast</h3>
                <p className="mt-1.5 text-sm text-gray-500">
                  Are you sure you want to delete this broadcast file? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteCourseBroadcast(b.broadcast_id, b.offering_id, b.r2_file_key);
                    setIsDeleteConfirmOpen(false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
