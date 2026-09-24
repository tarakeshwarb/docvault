import { Users } from "lucide-react";
import { getAllFaculty } from "../actions";
import { getDepartments } from "../departments/actions";
import { getFacultySession } from "@/lib/auth";
import { FacultyDirectoryTable } from "./FacultyDirectoryTable";
import { BulkUploadFaculty } from "./BulkUploadFaculty";

export const dynamic = "force-dynamic";

export default async function FacultyDirectoryPage() {
  const session = await getFacultySession();
  const isDev = session?.role === "developer";

  let faculty = await getAllFaculty();
  if (!isDev) {
    faculty = faculty.filter(f => f.role !== "developer");
  }

  const departments = await getDepartments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Faculty Directory
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {faculty.length} faculty members · hover a row and click{" "}
            <span className="font-medium text-gray-700">Edit</span> to modify.
          </p>
        </div>
        <BulkUploadFaculty />
      </div>

      <FacultyDirectoryTable faculty={faculty} departments={departments} />
    </div>
  );
}
