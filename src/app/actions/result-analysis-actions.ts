"use server";

import { queryDb } from "@/lib/db";
import { getFacultySession } from "@/lib/auth";

export async function getGlobalResultAnalysisData(offeringId: string) {
  const session = await getFacultySession();
  if (!session) return { deptOfferings: [], components: [] };

  try {
    // 1. Get departments assigned to this offering
    const deptOfferings = await queryDb<{
      department_id: string;
      department_name: string;
      offering_id: string;
    }>(
      `SELECT DISTINCT ON (dm.department_id)
        dm.department_id,
        dm.department_name,
        dca.offering_id
      FROM public.department_master dm
      LEFT JOIN public.dept_coordinator_assignment dca
        ON dca.department_id = dm.department_id
        AND dca.offering_id = $1
      ORDER BY dm.department_id, dm.department_name`,
      [offeringId]
    );

    // 2. Get components for this offering
    const components = await queryDb<{
      component_id: string;
      component_name: string;
      created_at: string;
    }>(
      `SELECT DISTINCT ON (cmp.component_id)
        cmp.component_id,
        cmp.component_name,
        cc.created_at
      FROM public.course_component cc
      JOIN public.component_master cmp ON cc.component_id = cmp.component_id
      WHERE cc.offering_id = $1
      ORDER BY cmp.component_id, cc.created_at`,
      [offeringId]
    );

    return { deptOfferings, components };
  } catch (error) {
    console.error("Failed to fetch global result analysis data:", error);
    return { deptOfferings: [], components: [] };
  }
}
