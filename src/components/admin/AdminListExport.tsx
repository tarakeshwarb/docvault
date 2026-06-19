"use client";

import { ExcelExportButton } from "@/components/ui/ExcelExportButton";
import type { ExportColumn } from "@/lib/export-client";

type Kind = "faculty" | "courses" | "offerings";

const CONFIG: Record<
  Kind,
  {
    filename: string;
    title: string;
    subtitle: string;
    sheetName: string;
    orientation: "portrait" | "landscape";
    columns: ExportColumn[];
    map: (r: Record<string, unknown>) => Record<string, unknown>;
  }
> = {
  faculty: {
    filename: "Faculty_Directory",
    title: "Faculty Directory",
    subtitle: "SRM Academic Portal — Faculty master list",
    sheetName: "Faculty",
    orientation: "landscape",
    columns: [
      { header: "ID", key: "faculty_id", width: 12 },
      { header: "Name", key: "faculty_name", width: 26 },
      { header: "Designation", key: "designation", width: 22 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile", key: "mobile_no", width: 16 },
      { header: "Role", key: "role", width: 16 },
    ],
    map: (f) => ({
      faculty_id: f.faculty_id,
      faculty_name: f.faculty_name,
      designation: f.designation,
      email: f.email,
      mobile_no: f.mobile_no,
      role: String(f.role ?? "").replace(/_/g, " "),
    }),
  },
  courses: {
    filename: "Course_Catalog",
    title: "Course Catalog",
    subtitle: "SRM Academic Portal — Course master list",
    sheetName: "Courses",
    orientation: "portrait",
    columns: [
      { header: "Course Code", key: "course_code", width: 16 },
      { header: "Course Name", key: "course_name", width: 40 },
      { header: "Credits", key: "credits", width: 12 },
      { header: "Created", key: "created_at", width: 18 },
    ],
    map: (c) => ({
      course_code: c.course_code,
      course_name: c.course_name,
      credits: c.credits,
      created_at: c.created_at
        ? new Date(c.created_at as string).toLocaleDateString("en-IN", {
            dateStyle: "medium",
          })
        : "",
    }),
  },
  offerings: {
    filename: "Course_Offerings",
    title: "Course Offerings",
    subtitle: "SRM Academic Portal — Course-to-semester mapping",
    sheetName: "Offerings",
    orientation: "landscape",
    columns: [
      { header: "Course Code", key: "course_code", width: 16 },
      { header: "Course Name", key: "course_name", width: 36 },
      { header: "Semester", key: "semester_name", width: 18 },
      { header: "Academic Year", key: "year_name", width: 18 },
      { header: "Coordinator", key: "coordinator_name", width: 24 },
    ],
    map: (o) => ({
      course_code: o.course_code,
      course_name: o.course_name,
      semester_name: o.semester_name,
      year_name: o.year_name,
      coordinator_name: o.coordinator_name ?? "Not assigned",
    }),
  },
};

export function AdminListExport({
  kind,
  rows,
}: {
  kind: Kind;
  rows: Record<string, unknown>[];
}) {
  const cfg = CONFIG[kind];
  return (
    <ExcelExportButton
      variant="light"
      disabled={rows.length === 0}
      build={() => ({
        filename: cfg.filename,
        title: cfg.title,
        subtitle: cfg.subtitle,
        sheetName: cfg.sheetName,
        orientation: cfg.orientation,
        columns: cfg.columns,
        rows: rows.map(cfg.map),
      })}
    />
  );
}
