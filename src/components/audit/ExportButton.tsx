"use client";

import { ExcelExportButton } from "@/components/ui/ExcelExportButton";
import type { AuditFacultySubmission } from "@/app/audit/actions";

export function ExportButton({ data }: { data: AuditFacultySubmission[] }) {
  // Flatten the raw rows for export — one row per file (submitted), or one row per unsubmitted component
  const exportRows = data
    .filter((row) => row.component_name) // skip assignments with no components
    .filter((row) => row.status === "submitted" || row.status === "unsubmitted")
    .filter((row, i, arr) => {
      // For submitted rows with files, show per file. For unsubmitted (no files), show once per submission.
      if (row.status === "unsubmitted") {
        // Show only once per submission_id
        return arr.findIndex((r) => r.submission_id === row.submission_id) === i;
      }
      return true;
    });

  return (
    <ExcelExportButton
      variant="light"
      disabled={exportRows.length === 0}
      build={() => ({
        filename: "IQAC_Audit_Trail",
        title: "IQAC Audit & Compliance — Master Action Trail",
        subtitle: "Per-faculty submission and deletion activity across all terms",
        sheetName: "Audit Trail",
        orientation: "landscape",
        columns: [
          { header: "Academic Year", key: "year_name", width: 16 },
          { header: "Semester", key: "semester_name", width: 16 },
          { header: "Course Code", key: "course_code", width: 14 },
          { header: "Course Name", key: "course_name", width: 28 },
          { header: "Section", key: "section_name", width: 12 },
          { header: "Batch", key: "batch", width: 10 },
          { header: "Faculty Name", key: "faculty_name", width: 22 },
          { header: "Component", key: "component_name", width: 20 },
          { header: "Status", key: "status", width: 18 },
          { header: "Submitted At", key: "submitted_at", width: 22 },
          { header: "File Name", key: "file_name", width: 30 },
          { header: "Version", key: "version", width: 10 },
        ],
        rows: exportRows.map((row) => ({
          year_name: row.year_name,
          semester_name: row.semester_name,
          course_code: row.course_code,
          course_name: row.course_name,
          section_name: row.section_name,
          batch: row.batch,
          faculty_name: row.faculty_name,
          component_name: row.component_name ?? "",
          status:
            row.status === "submitted"
              ? "Submitted"
              : row.status === "unsubmitted"
              ? "Deleted by Faculty"
              : "Pending",
          submitted_at: row.submitted_at
            ? new Date(row.submitted_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—",
          file_name: row.file_name ?? "—",
          version: row.version ? `v${row.version}` : "—",
        })),
      })}
    />
  );
}
