"use client";

import { ExcelExportButton } from "@/components/ui/ExcelExportButton";

type Assignment = { id: string; faculty_name: string; section_name: string };
type Component = { id: string; component_name: string };

function statusLabel(s: string | undefined): string {
  if (s === "submitted") return "Submitted";
  if (s === "late") return "Late";
  return "Pending";
}

/**
 * Exports the submission-tracking matrix as a print-ready Excel register:
 * one row per faculty, one column per required component, plus completion.
 */
export function CoordinatorExportButton({
  offering,
  assignments,
  components,
  statuses,
}: {
  offering: {
    course_code: string;
    course_name: string;
    semester_name: string;
    year_name: string;
  };
  assignments: Assignment[];
  components: Component[];
  /** keyed `${assignmentId}::${componentId}` -> status */
  statuses: Record<string, string>;
}) {
  return (
    <ExcelExportButton
      variant="light"
      disabled={assignments.length === 0 || components.length === 0}
      label="Export Register"
      build={() => {
        const columns = [
          { header: "Faculty", key: "faculty", width: 24 },
          { header: "Section", key: "section", width: 12 },
          ...components.map((c) => ({
            header: c.component_name,
            key: `comp_${c.id}`,
            width: 18,
          })),
          { header: "Submitted", key: "submitted", width: 12 },
          { header: "Completion", key: "completion", width: 12 },
        ];

        const rows = assignments.map((fa) => {
          const row: Record<string, unknown> = {
            faculty: fa.faculty_name,
            section: fa.section_name,
          };
          let submitted = 0;
          components.forEach((c) => {
            const s = statuses[`${fa.id}::${c.id}`];
            if (s === "submitted" || s === "late") submitted += 1;
            row[`comp_${c.id}`] = statusLabel(s);
          });
          row.submitted = `${submitted} / ${components.length}`;
          row.completion = `${
            components.length ? Math.round((submitted / components.length) * 100) : 0
          }%`;
          return row;
        });

        return {
          filename: `Submission_Register_${offering.course_code}`,
          title: `Submission Status Register — ${offering.course_code} ${offering.course_name}`,
          subtitle: `${offering.semester_name} · ${offering.year_name}`,
          sheetName: "Submission Register",
          orientation: "landscape" as const,
          columns,
          rows,
        };
      }}
    />
  );
}
