"use server";

import { revalidatePath } from "next/cache";
import {
  getSavedAnalysis,
  upsertAnalysis,
  getComponentsForOffering,
  createOfferingComponent,
} from "@/lib/result-analysis-data";
import { validateInput, type ResultAnalysisInput } from "@/lib/result-analysis";

/** Load existing figures for one (section, component). */
export async function getResultAnalysisAction(
  faculty_assignment_id: string,
  component_id: string
) {
  return getSavedAnalysis(faculty_assignment_id, component_id);
}

/** Components the faculty can run analysis on for a given offering. */
export async function getComponentsForOfferingAction(offering_id: string) {
  return getComponentsForOffering(offering_id);
}

/** Create a new component (e.g. CT1, FT3) and attach it to the offering. */
export async function createComponentAction(offering_id: string, name: string) {
  return createOfferingComponent(offering_id, name);
}

/** Validate + save the figures. Returns { ok, errors }. */
export async function saveResultAnalysisAction(data: {
  offering_id: string;
  faculty_assignment_id: string;
  component_id: string;
  total_strength: number;
  total_absentees: number;
  ranges: number[];
}): Promise<{ ok: boolean; errors: string[] }> {
  // Reuse the generator's validation (sum of ranges must equal present students).
  const probe = {
    totalStrength: Number(data.total_strength) || 0,
    totalAbsentees: Number(data.total_absentees) || 0,
    ranges: data.ranges,
  } as ResultAnalysisInput;
  const errors = validateInput(probe);
  if (errors.length > 0) return { ok: false, errors };

  await upsertAnalysis({
    offering_id: data.offering_id,
    faculty_assignment_id: data.faculty_assignment_id,
    component_id: data.component_id,
    total_strength: probe.totalStrength,
    total_absentees: probe.totalAbsentees,
    ranges: data.ranges,
  });

  revalidatePath("/faculty");
  return { ok: true, errors: [] };
}
