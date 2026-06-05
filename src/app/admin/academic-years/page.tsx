import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getAcademicYears } from "./actions";
import { formatDate } from "@/lib/utils";

export default async function AcademicYearsPage() {
  const years = await getAcademicYears();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Academic Years</h1>
          <p className="text-sm text-[var(--color-muted)]">Manage the academic calendar years.</p>
        </div>
        <a href="/admin/academic-years/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors">
          <Plus className="w-4 h-4" />
          Add Academic Year
        </a>
      </div>

      <div className="rounded-xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-black/5">
            <tr>
              <th className="px-6 py-4">Year Name</th>
              <th className="px-6 py-4">Start Date</th>
              <th className="px-6 py-4">End Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {years.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No academic years found.
                </td>
              </tr>
            ) : (
              years.map((year) => (
                <tr key={year.year_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--color-ink)]">{year.year_name}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(year.start_date)}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(year.end_date)}</td>
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
