import { notFound } from "next/navigation";
import { getCourseById } from "../../../actions";
import EditCourseClient from "./EditCourseClient";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  return <EditCourseClient course={course} />;
}
