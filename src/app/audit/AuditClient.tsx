"use client";

import { useState } from "react";
import { ExportButton } from "@/components/audit/ExportButton";
import { FileText, ShieldCheck, Search, Filter } from "lucide-react";
import type { AuditLog } from "./actions";

export default function AuditClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch =
      log.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.course_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = yearFilter ? log.year_name === yearFilter : true;
    const matchesSemester = semesterFilter ? log.semester_name === semesterFilter : true;
    return matchesSearch && matchesYear && matchesSemester;
  });

  const uniqueYears = Array.from(new Set(initialLogs.map(l => l.year_name)));
  const uniqueSemesters = Array.from(new Set(initialLogs.map(l => l.semester_name)));

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between rounded-[28px] bg-[#2b4f8c] p-6 text-white shadow-[0_18px_50px_rgba(43,79,140,0.18)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            IQAC Audit & Compliance
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Master Action Trail</h1>
          <p className="mt-1 text-sm text-white/70">
            Monitor all document uploads, assignments, and system activities across all terms.
          </p>
        </div>
        <ExportButton data={filteredLogs} />
      </div>

      {/* Main Content */}
      <div>
        
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center bg-white p-4 rounded-xl border border-black/5 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty, course, or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] bg-white min-w-[120px]"
            >
              <option value="">All Years</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-[var(--color-accent)] bg-white min-w-[140px]"
            >
              <option value="">All Semesters</option>
              {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-black/5 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Context</th>
                  <th className="px-6 py-4">Faculty</th>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No audit logs found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="block text-[var(--color-ink)] font-medium">
                          {new Date(log.uploaded_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.uploaded_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-[var(--color-ink)] font-medium">
                          {log.course_code} - {log.section_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.semester_name} • {log.year_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-[var(--color-ink)]">{log.uploaded_by}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-[var(--color-ink)] font-medium max-w-[200px] truncate" title={log.file_name}>
                          {log.file_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.component_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                          v{log.version}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={log.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
