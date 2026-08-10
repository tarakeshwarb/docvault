"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Mail, MailCheck, Loader2 } from "lucide-react";
import { sendReminderEmail } from "../actions";
import type { FacultyAssignment, Component, SubmissionStatus } from "../actions";
import { SubmissionFilesModal } from "@/components/coordinator/SubmissionFilesModal";

export function SubmissionTrackingMatrix({
  offering_id,
  assignments,
  components,
  submissions,
  currentFacultyId,
  baseUrl,
}: {
  offering_id: string;
  assignments: FacultyAssignment[];
  components: Component[];
  submissions: SubmissionStatus[];
  currentFacultyId: number;
  baseUrl: string;
}) {
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});

  const handleSendReminder = async (faculty_assignment_id: string) => {
    setLoadingIds((prev) => ({ ...prev, [faculty_assignment_id]: true }));
    try {
      await sendReminderEmail(offering_id, faculty_assignment_id);
      setSentIds((prev) => ({ ...prev, [faculty_assignment_id]: true }));
      // Optional: hide "sent" status after a few seconds
      setTimeout(() => {
        setSentIds((prev) => ({ ...prev, [faculty_assignment_id]: false }));
      }, 3000);
    } catch (err) {
      console.error("Failed to send reminder", err);
      alert("Failed to send reminder email. Please try again.");
    } finally {
      setLoadingIds((prev) => ({ ...prev, [faculty_assignment_id]: false }));
    }
  };

  if (assignments.length === 0) {
    return (
      <div className="panel-card border-dashed border-gray-200 p-5 text-center">
        <p className="text-sm text-gray-500">No faculty assigned yet to track submissions.</p>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="panel-card border-dashed border-gray-200 p-5 text-center">
        <p className="text-sm text-gray-500">No tracked document requirements added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          Submission Matrix
        </h2>
        <p className="text-sm text-gray-500">
          Easily track which faculty have completed their required uploads.
        </p>
      </div>
      
      <div className="panel-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5 whitespace-nowrap">
            <tr>
              <th className="px-5 py-3 sticky left-0 bg-gray-50/70 z-10">Faculty</th>
              {components.map((comp) => (
                <th key={comp.id} className="px-5 py-3 text-center border-l border-black/5">
                  <div className="flex flex-col items-center justify-center">
                    <span className="max-w-[120px] truncate" title={comp.component_name}>
                      {comp.component_name}
                    </span>
                    {comp.deadline && (
                      <span className="text-[10px] font-normal mt-1">
                        Due: {new Date(comp.deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-5 py-3 text-right border-l border-black/5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {assignments.map((fa) => {
              const facultySubmissions = submissions.filter(
                (s) => s.faculty_assignment_id === fa.id
              );
              
              // Check if all components are done
              let allDone = true;
              
              const cells = components.map((comp) => {
                const sub = facultySubmissions.find((s) => s.course_component_id === comp.id);
                const status = sub ? sub.status : "pending";
                
                const isDone = status === "submitted" || status === "approved";
                if (!isDone) allDone = false;

                return (
                  <td key={comp.id} className="px-5 py-3 text-center border-l border-black/5">
                    <SubmissionFilesModal
                      submission_id={sub?.submission_id ?? ""}
                      faculty_name={fa.faculty_name}
                      component_name={comp.component_name}
                      section_name={fa.section_name}
                      status={status}
                      offering_id={offering_id}
                      baseUrl={baseUrl}
                      currentFacultyId={currentFacultyId}
                    />
                  </td>
                );
              });

              const isSending = loadingIds[fa.id];
              const isSent = sentIds[fa.id];

              return (
                <tr key={fa.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap sticky left-0 bg-white group-hover:bg-gray-50/50 transition-colors z-10 border-r border-transparent">
                    <div className="font-medium text-[var(--color-ink)]">{fa.faculty_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{fa.section_name}</div>
                  </td>
                  
                  {cells}

                  <td className="px-5 py-3 text-right border-l border-black/5 whitespace-nowrap">
                    {allDone ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 px-3 py-1.5 bg-green-50 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Done
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendReminder(fa.id)}
                        disabled={isSending || isSent || !fa.email}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-ink)]/80 disabled:opacity-50 transition-colors"
                        title={fa.email ? `Send reminder to ${fa.email}` : "No email configured"}
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending
                          </>
                        ) : isSent ? (
                          <>
                            <MailCheck className="w-3.5 h-3.5 text-green-400" /> Sent!
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" /> Remind
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
