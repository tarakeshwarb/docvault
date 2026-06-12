"use client";

import { ExcelExportButton } from "@/components/ui/ExcelExportButton";

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
  return (
    <ExcelExportButton
      variant="light"
      disabled={data.length === 0}
      build={() => ({
        filename: "IQAC_Audit_Trail",
        title: "IQAC Audit & Compliance — Master Action Trail",
        subtitle: "Document upload and assignment activity across all terms",
        sheetName: "Audit Trail",
        orientation: "landscape",
        columns: [
          { header: "Timestamp", key: "timestamp", width: 20 },
          { header: "Academic Year", key: "year_name", width: 16 },
          { header: "Semester", key: "semester_name", width: 16 },
          { header: "Course Code", key: "course_code", width: 14 },
          { header: "Course Name", key: "course_name", width: 28 },
          { header: "Section", key: "section_name", width: 12 },
          { header: "Component", key: "component_name", width: 20 },
          { header: "Faculty Name", key: "uploaded_by", width: 22 },
          { header: "File Name", key: "file_name", width: 30 },
          { header: "Version", key: "version", width: 10 },
        ],
        rows: data.map((log) => ({
          timestamp: new Date(log.uploaded_at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          year_name: log.year_name,
          semester_name: log.semester_name,
          course_code: log.course_code,
          course_name: log.course_name,
          section_name: log.section_name,
          component_name: log.component_name,
          uploaded_by: log.uploaded_by,
          file_name: log.file_name,
          version: `v${log.version}`,
        })),
      })}
    />
  );
}
