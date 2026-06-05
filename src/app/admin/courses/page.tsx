import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCourses } from "../actions";
import { formatDate } from "@/lib/utils";

export default async function CoursesPage() {
  const courses = await getCourses();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Courses</h1>
          <p className="text-sm text-[var(--color-muted)]">Manage course catalog and syllabus details.</p>
        </div>
        <a href="/admin/courses/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors">
          <Plus className="w-4 h-4" />
          Add Course
        </a>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-black/5">
            <tr>
              <th className="px-6 py-4">Course Code</th>
              <th className="px-6 py-4">Course Name</th>
              <th className="px-6 py-4">Credits</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.course_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--color-ink)]">{course.course_code}</td>
                  <td className="px-6 py-4 text-[var(--color-ink)]">{course.course_name}</td>
                  <td className="px-6 py-4 text-gray-500">{course.credits}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(course.created_at)}</td>
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
