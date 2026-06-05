import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { getSemesters } from "./actions";

export default async function SemestersPage() {
  const semesters = await getSemesters();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Semesters</h1>
          <p className="text-sm text-[var(--color-muted)]">Manage semesters and active academic terms.</p>
        </div>
        <a href="/admin/semesters/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors">
          <Plus className="w-4 h-4" />
          Add Semester
        </a>
      </div>

      <div className="rounded-xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-black/5">
            <tr>
              <th className="px-6 py-4">Semester Name</th>
              <th className="px-6 py-4">Academic Year</th>
              <th className="px-6 py-4 text-center">Active Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {semesters.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No semesters found.
                </td>
              </tr>
            ) : (
              semesters.map((semester) => (
                <tr key={semester.semester_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--color-ink)]">{semester.semester_name}</td>
                  <td className="px-6 py-4 text-gray-500">{semester.year_name}</td>
                  <td className="px-6 py-4 text-center flex justify-center">
                    {semester.is_active ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-[var(--color-accent)]">Edit</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
