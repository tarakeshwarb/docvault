import { getAcademicYears } from "../../actions";
import { getSemesters } from "../actions";
import NewSemesterClient from "./NewSemesterClient";

export const dynamic = "force-dynamic";

export default function Page() {
  const yearsPromise = getAcademicYears();
  const semestersPromise = getSemesters();
  return (
    <NewSemesterClient
      academicYearsPromise={yearsPromise}
      semestersPromise={semestersPromise}
    />
  );
}
