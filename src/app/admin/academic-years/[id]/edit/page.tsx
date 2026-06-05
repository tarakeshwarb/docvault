import { notFound } from "next/navigation";
import { getAcademicYearById } from "../../actions";
import EditYearClient from "./EditYearClient";

export default async function EditAcademicYearPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const year = await getAcademicYearById(id);

  if (!year) {
    notFound();
  }

  return <EditYearClient year={year} />;
}
