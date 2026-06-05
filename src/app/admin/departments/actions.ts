"use server";

import { queryDb, executeDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type Department = {
  department_id: string;
  department_name: string;
  created_at: string;
};

export async function getDepartments(): Promise<Department[]> {
  try {
    return await queryDb<Department>(
      "SELECT * FROM public.department_master ORDER BY department_name ASC"
    );
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return [];
  }
}

export async function createDepartment(formData: FormData) {
  const name = formData.get("department_name") as string;
  
  if (!name || name.trim() === "") {
    throw new Error("Department name is required.");
  }

  await executeDb(
    "INSERT INTO public.department_master (department_name) VALUES ($1)",
    [name.trim()]
  );
  
  revalidatePath("/admin/departments");
}
