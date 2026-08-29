import { Plus, Link2 } from "lucide-react";
import { getCourseOfferings, getCourses, getAllFaculty } from "../actions";
import { NewOfferingForm } from "./NewOfferingForm";
import { queryDb } from "@/lib/db";

async function getSemesters() {
  return queryDb<{ semester_id: string; semester_name: string; year_name: string }>(`
    SELECT s.semester_id, s.semester_name, y.year_name
    FROM public.semester_master s
    JOIN public.academic_year y ON s.year_id = y.year_id
    ORDER BY y.start_date DESC, s.semester_name
  `);
}

export default async function OfferingsPage() {
  const [offerings, courses, allFaculty, semesters] = await Promise.all([
    getCourseOfferings(),
    getCourses(),
    getAllFaculty(),
    getSemesters(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Course Offerings
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Map courses to semesters and assign course coordinators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NewOfferingForm courses={courses} semesters={semesters} coordinators={allFaculty} />
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Semester</th>
              <th className="px-6 py-4">Academic Year</th>
              <th className="px-6 py-4">Coordinators</th>
              <th className="px-6 py-4">Audit Professors</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {offerings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
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
                    <div className="space-y-1">
                      {o.primary_coordinator.faculty_name ? (
                        <div className="text-sm">
                          <span className="text-[var(--color-ink)]">{o.primary_coordinator.faculty_name}</span>
                          <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Primary</span>
                        </div>
                      ) : (
                        <span className="text-orange-500 text-xs font-medium">⚠ Not assigned</span>
                      )}
                      {o.secondary_coordinators.map((c) => (
                        <div key={c.faculty_id} className="text-sm text-gray-600">
                          {c.faculty_name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {o.audit_professors.length > 0 ? (
                      <div className="space-y-1">
                        {o.audit_professors.map((a) => (
                          <div key={a.faculty_id} className="text-sm text-[var(--color-ink)]">
                            {a.faculty_name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
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
