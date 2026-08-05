import { NextResponse } from "next/server";
import {
  buildSectionInput,
  buildConsolidatedInputs,
} from "@/lib/result-analysis-data";
import {
  generateResultAnalysisXlsx,
  generateResultAnalysisPdf,
  generateConsolidatedResultAnalysisXlsx,
  generateResultAnalysisRegisterXlsx,
  consolidate,
  type ResultAnalysisInput,
} from "@/lib/result-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  scope: "section" | "consolidated" | "register";
  format: "xlsx" | "pdf";
  component_id?: string;
  component_ids?: string[];
  faculty_assignment_id?: string;
  offering_id?: string;
};

const XLSX_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function safeName(s: string): string {
  return (s || "result-analysis")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { scope, format } = body;
  const ids = body.component_ids || (body.component_id ? [body.component_id] : []);

  if (ids.length === 0 || !scope || !format) {
    return NextResponse.json(
      { error: "scope, format and component_id(s) are required." },
      { status: 400 }
    );
  }

  // Consolidated register (mam's all-sections table). Always XLSX.
  if (scope === "register") {
    try {
      if (!body.offering_id) {
        return NextResponse.json({ error: "offering_id is required." }, { status: 400 });
      }
      const sections = await buildConsolidatedInputs(body.offering_id, ids[0]);
      if (sections.length === 0) {
        return NextResponse.json(
          { error: "No section analyses have been entered yet for this component." },
          { status: 404 }
        );
      }
      const first = sections[0];
      const buffer = await generateResultAnalysisRegisterXlsx(
        {
          courseCode: first.courseCode,
          courseName: first.courseName,
          component: first.component,
          academicYear: first.academicYear,
          semester: first.semester,
        },
        sections
      );
      const stamp = new Date().toISOString().split("T")[0];
      const name = `${safeName(`${first.courseCode}_${first.component}_Register`)}_${stamp}`;
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": XLSX_CT,
          "Content-Disposition": `attachment; filename="${name}.xlsx"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      console.error("result-analysis register failed", err);
      return NextResponse.json({ error: "Failed to build the register." }, { status: 500 });
    }
  }

  // Assemble the inputs to render.
  let inputs: ResultAnalysisInput[] = [];
  let baseName = "result-analysis";
  try {
    if (scope === "section") {
      if (!body.faculty_assignment_id) {
        return NextResponse.json({ error: "faculty_assignment_id is required." }, { status: 400 });
      }
      const input = await buildSectionInput(body.faculty_assignment_id, ids[0]);
      if (!input) {
        return NextResponse.json({ error: "Section not found." }, { status: 404 });
      }
      inputs = [input];
      baseName = `${input.courseCode}_${input.component}_${input.yearSection}_RA`;
    } else {
      if (format === "xlsx") {
        if (!body.offering_id) {
          return NextResponse.json({ error: "offering_id is required." }, { status: 400 });
        }
        const componentSectionsMap: Record<string, ResultAnalysisInput[]> = {};
        for (const cid of ids) {
          const sections = await buildConsolidatedInputs(body.offering_id, cid);
          if (sections.length > 0) {
            componentSectionsMap[sections[0].component] = sections;
          }
        }
        if (Object.keys(componentSectionsMap).length === 0) {
          return NextResponse.json(
            { error: "No section analyses have been entered yet for the selected components." },
            { status: 404 }
          );
        }
        const firstComponent = Object.values(componentSectionsMap)[0][0];
        const fileName = ids.length === 1 
          ? `${firstComponent.courseCode}_${firstComponent.component}_Consolidated_RA`
          : `${firstComponent.courseCode}_Multi_Result_Analysis`;
        const buffer = await generateConsolidatedResultAnalysisXlsx(componentSectionsMap);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
            "Cache-Control": "no-store",
          },
        });
      }

      if (!body.offering_id) {
        return NextResponse.json({ error: "offering_id is required." }, { status: 400 });
      }
      for (const cid of ids) {
        const sections = await buildConsolidatedInputs(body.offering_id, cid);
        if (sections.length > 0) {
          const first = sections[0];
          const cons = consolidate(sections, {
            courseCode: first.courseCode,
            courseName: first.courseName,
            component: first.component,
            academicYear: first.academicYear,
            dept: first.dept,
            semester: first.semester,
          });
          if (ids.length > 1) {
            inputs.push(cons);
          } else {
            cons.component = `${first.component} (Consolidated)`;
            inputs.push(...sections, cons);
          }
        }
      }

      if (inputs.length === 0) {
        return NextResponse.json(
          { error: "No section analyses have been entered yet for the selected components." },
          { status: 404 }
        );
      }
      
      if (ids.length === 1) {
        baseName = `${inputs[0].courseCode}_${inputs[0].component}_Consolidated_RA`;
      } else {
        baseName = `${inputs[0].courseCode}_Multi_Result_Analysis`;
      }
    }
  } catch (err) {
    console.error("result-analysis build failed", err);
    return NextResponse.json({ error: "Failed to load analysis data." }, { status: 500 });
  }

  // Render the requested format.
  try {
    const stamp = new Date().toISOString().split("T")[0];
    const name = `${safeName(baseName)}_${stamp}`;
    if (format === "xlsx") {
      const buffer = await generateResultAnalysisXlsx(inputs);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${name}.xlsx"`,
          "Cache-Control": "no-store",
        },
      });
    }
    const buffer = await generateResultAnalysisPdf(inputs);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("result-analysis render failed", err);
    return NextResponse.json({ error: "Failed to generate the report." }, { status: 500 });
  }
}
