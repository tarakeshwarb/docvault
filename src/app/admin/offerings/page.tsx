import { Plus, Link2 } from "lucide-react";
import { getCourseOfferings } from "../actions";
import { AdminListExport } from "@/components/admin/AdminListExport";

export default async function OfferingsPage() {
  const offerings = await getCourseOfferings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Course Offerings
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Map courses to semesters and assign course coordinators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminListExport kind="offerings" rows={offerings} />
          <a
            href="/admin/offerings/new"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Offering
          </a>
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Semester</th>
              <th className="px-6 py-4">Academic Year</th>
              <th className="px-6 py-4">Coordinator</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {offerings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Link2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">
                    No course offerings yet. Create one to get started.
                  </p>
                </td>
              </tr>
            ) : (
              offerings.map((o) => (
                <tr key={o.offering_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[var(--color-ink)]">{o.course_name}</p>
                    <p className="text-xs text-gray-500">{o.course_code}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{o.semester_name}</td>
                  <td className="px-6 py-4 text-gray-600">{o.year_name}</td>
                  <td className="px-6 py-4">
                    {o.coordinator_name ? (
                      <span className="text-[var(--color-ink)] font-medium">{o.coordinator_name}</span>
                    ) : (
                      <span className="text-orange-500 text-xs font-medium">⚠ Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/admin/offerings/${o.offering_id}`}
                      className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                    >
                      Manage
                    </a>
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
