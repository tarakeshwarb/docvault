"use client";

import { FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SubmissionFilesModal } from "../coordinator/SubmissionFilesModal";

export function FacultyReviewSubmissions({
  components,
  submissions,
  facultyId,
  baseUrl,
  offeringId
}: {
  components: { component_id: string; component_name: string }[];
  submissions: {
    submission_id: string;
    course_component_id: string;
    status: string;
    submitted_at: string;
    faculty_name: string;
    section_name: string;
  }[];
  facultyId: number;
  baseUrl?: string;
  offeringId: string;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">Review Submissions</h2>
        <p className="text-sm text-gray-500 mb-6">
          You have been assigned as a verifying faculty for the following components. Please review the submitted files and approve them.
        </p>
      </div>

      {components.map(comp => {
        const compSubmissions = submissions.filter(s => s.course_component_id === comp.component_id);

        return (
          <div key={comp.component_id} className="panel-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                {comp.component_name}
              </h3>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {compSubmissions.filter(s => s.status === "approved").length} / {compSubmissions.length} Approved
              </span>
            </div>
            
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/30 text-gray-500 font-medium border-b border-black/5">
                <tr>
                  <th className="px-5 py-3">Faculty</th>
                  <th className="px-5 py-3">Section</th>
                  <th className="px-5 py-3">Submitted At</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {compSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      No submissions found for this component.
                    </td>
                  </tr>
                ) : (
                  compSubmissions.map(sub => (
                    <tr key={sub.submission_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{sub.faculty_name}</td>
                      <td className="px-5 py-3 text-gray-600">{sub.section_name}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {sub.submitted_at ? formatDate(sub.submitted_at) : "N/A"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <SubmissionFilesModal
                          submission_id={sub.submission_id}
                          faculty_name={sub.faculty_name}
                          component_name={comp.component_name}
                          section_name={sub.section_name}
                          status={sub.status}
                          offering_id={offeringId}
                          baseUrl={baseUrl || ""}
                          currentFacultyId={facultyId}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
