"use client";

import { Download } from "lucide-react";

type AuditLog = {
  log_id: string;
  file_name: string;
  version: number;
  uploaded_at: string;
  uploaded_by: string;
  course_code: string;
  course_name: string;
  section_name: string;
  component_name: string;
  semester_name: string;
  year_name: string;
  file_url: string;
};

export function ExportButton({ data }: { data: AuditLog[] }) {
  function handleExport() {
    const headers = [
      "Timestamp",
      "Academic Year",
      "Semester",
      "Course Code",
      "Course Name",
      "Section",
      "Component",
      "Faculty Name",
      "File Name",
      "Version",
      "File URL"
    ];

    const rows = data.map((log) => [
      new Date(log.uploaded_at).toLocaleString(),
      log.year_name,
      log.semester_name,
      log.course_code,
      log.course_name,
      log.section_name,
      log.component_name,
      log.uploaded_by,
      log.file_name,
      `v${log.version}`,
      log.file_url
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IQAC_Audit_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] shadow-sm hover:bg-gray-50 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export to CSV
    </button>
  );
}
