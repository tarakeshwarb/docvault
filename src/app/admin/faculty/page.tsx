import { Users } from "lucide-react";
import { getAllFaculty } from "../actions";
import { AdminListExport } from "@/components/admin/AdminListExport";

const roleBadge: Record<string, { label: string; classes: string }> = {
  admin: { label: "Admin", classes: "bg-slate-100 text-slate-700 ring-slate-700/10" },
  hod: { label: "HOD", classes: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/20" },
  course_coordinator: { label: "Coordinator", classes: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/20" },
  faculty: { label: "Faculty", classes: "bg-gray-50 text-gray-700 ring-gray-700/10" },
};

export default async function FacultyDirectoryPage() {
  const faculty = await getAllFaculty();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Faculty Directory
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {faculty.length} faculty members loaded from the database.
          </p>
        </div>
        <AdminListExport kind="faculty" rows={faculty} />
      </div>

      <div className="panel-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Designation</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Mobile</th>
              <th className="px-6 py-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {faculty.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">No faculty found.</p>
                </td>
              </tr>
            ) : (
              faculty.map((f) => {
                const badge = roleBadge[f.role] ?? roleBadge.faculty;
                return (
                  <tr key={f.faculty_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{f.faculty_id}</td>
                    <td className="px-6 py-3 font-medium text-[var(--color-ink)]">{f.faculty_name}</td>
                    <td className="px-6 py-3 text-gray-600 text-xs">{f.designation}</td>
                    <td className="px-6 py-3 text-gray-600 text-xs">{f.email}</td>
                    <td className="px-6 py-3 text-gray-600 text-xs">{f.mobile_no}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
