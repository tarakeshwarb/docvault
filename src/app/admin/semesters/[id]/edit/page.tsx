import { notFound } from "next/navigation";
import { getSemesterById } from "../../actions";
import { getAcademicYears } from "../../../academic-years/actions";
import EditSemesterClient from "./EditSemesterClient";

export default async function EditSemesterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const semester = await getSemesterById(id);

  if (!semester) {
    notFound();
  }

  const years = await getAcademicYears();

  return <EditSemesterClient semester={semester} years={years} />;
}
