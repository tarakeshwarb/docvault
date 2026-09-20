"use client";

import { useState } from "react";
import { Building2, Users, CheckCircle2 } from "lucide-react";
import type { SocFacultyAssignment, Component, SubmissionStatus } from "./actions";
import { SubmissionFilesModal } from "@/components/coordinator/SubmissionFilesModal";

export function SocDeptTrackingView({
  assignments,
  components,
  submissions,
  depts,
  currentFacultyId,
  baseUrl,
}: {
  assignments: SocFacultyAssignment[];
  components: Component[];
  submissions: SubmissionStatus[];
  depts: { department_id: string; department_name: string }[];
  currentFacultyId: number;
  baseUrl: string;
}) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  // Filter: when a dept is selected, show faculty whose department matches
  const filteredAssignments = selectedDept
    ? assignments.filter((a) => a.department_id === selectedDept)
    : assignments;

  // Stats
  const totalExpected = filteredAssignments.length * components.length;
  const totalSubmitted = submissions.filter(
    (s) =>
      filteredAssignments.some((a) => a.id === s.faculty_assignment_id) &&
      (s.status === "submitted" || s.status === "approved")
  ).length;
  const pct = totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : 0;

  if (components.length === 0) {
    return (
      <div className="panel-card border-dashed border-gray-300 p-8 text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="font-semibold text-gray-600">No document requirements defined yet</p>
        <p className="text-sm text-gray-400 mt-1">Add components from the Overview section first.</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="panel-card border-dashed border-gray-300 p-8 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="font-semibold text-gray-600">No faculty assigned yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Dept Coordinators need to assign faculty to sections first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="panel-card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">{filteredAssignments.length}</p>
          <p className="text-xs text-gray-500 mt-1">Faculty Shown</p>
        </div>
        <div className="panel-card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">{totalSubmitted}/{totalExpected}</p>
          <p className="text-xs text-gray-500 mt-1">Submissions Done</p>
        </div>
        <div className="panel-card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">{pct}%</p>
          <p className="text-xs text-gray-500 mt-1">Completion</p>
        </div>
      </div>

      {/* Department filter chips */}
      {depts.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
          <button
            onClick={() => setSelectedDept(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
              selectedDept === null
                ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
          >
            All Departments
            <span className={`ml-2 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${selectedDept === null ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {assignments.length}
            </span>
          </button>

          {depts.map((d) => {
            const count = assignments.filter((a) => a.department_id === d.department_id).length;
            const isActive = selectedDept === d.department_id;
            return (
              <button
                key={d.department_id}
                onClick={() => setSelectedDept(isActive ? null : d.department_id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                }`}
              >
                {d.department_name}
                <span className={`ml-2 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tracking matrix */}
      {filteredAssignments.length === 0 ? (
        <div className="panel-card border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500">No faculty found for the selected department.</p>
        </div>
      ) : (
        <div className="panel-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5 whitespace-nowrap">
              <tr>
                <th className="px-5 py-3 sticky left-0 bg-gray-50/70 z-10">Faculty / Section</th>
                {components.map((comp) => (
                  <th key={comp.id} className="px-5 py-3 text-center border-l border-black/5">
                    <div className="flex flex-col items-center justify-center">
                      <span className="max-w-[110px] truncate" title={comp.component_name}>
                        {comp.component_name}
                      </span>
                      {comp.deadline && (
                        <span className="text-[10px] font-normal mt-1 text-gray-400">
                          Due:{" "}
                          {new Date(comp.deadline).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredAssignments.map((fa) => {
                const facultySubmissions = submissions.filter(
                  (s) => s.faculty_assignment_id === fa.id
                );
                return (
                  <tr key={fa.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 sticky left-0 bg-white z-10">
                      <div className="font-medium text-[var(--color-ink)]">{fa.faculty_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{fa.section_name}</div>
                    </td>
                    {components.map((comp) => {
                      const sub = facultySubmissions.find(
                        (s) => s.course_component_id === comp.id
                      );
                      const status = sub ? sub.status : "pending";
                      return (
                        <td key={comp.id} className="px-5 py-3 text-center border-l border-black/5">
                          <SubmissionFilesModal
                            submission_id={sub?.submission_id ?? ""}
                            faculty_name={fa.faculty_name}
                            component_name={comp.component_name}
                            section_name={fa.section_name}
                            status={status}
                            offering_id={""}
                            baseUrl={baseUrl}
                            currentFacultyId={currentFacultyId}
                            readonly={true}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
