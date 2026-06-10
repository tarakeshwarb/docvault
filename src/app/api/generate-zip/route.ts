import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { buildR2Key, uploadPdfToR2 } from "@/lib/r2";
import JSZip from "jszip";

type FileRow = {
  file_name: string;
  s3_object_key: string;
  faculty_name: string;
  section_name: string;
  component_name: string;
};

export async function POST(req: NextRequest) {
  try {
    const { offering_id, component_id } = await req.json();

    if (!offering_id) {
      return NextResponse.json({ error: "offering_id is required" }, { status: 400 });
    }

    // Fetch all submitted files for this offering (optionally filtered by component)
    let query = `
      SELECT
        fm.file_name,
        fm.s3_object_key,
        f.faculty_name,
        sec.section_name,
        cmp.component_name
      FROM public.file_metadata fm
      JOIN public.submission s ON fm.submission_id = s.submission_id
      JOIN public.faculty_assignment fa ON s.faculty_assignment_id = fa.id
      JOIN public.faculty f ON fa.faculty_id = f.faculty_id
      JOIN public.section_master sec ON fa.section_id = sec.section_id
      JOIN public.course_component cc ON s.course_component_id = cc.id
      JOIN public.component_master cmp ON cc.component_id = cmp.component_id
      WHERE fa.offering_id = $1 AND s.status = 'submitted'
    `;
    const params: (string | number)[] = [offering_id];

    if (component_id) {
      query += ` AND cc.component_id = $2`;
      params.push(component_id);
    }

    query += ` ORDER BY sec.section_name, cmp.component_name, fm.file_name`;

    const files = await queryDb<FileRow>(query, params);

    if (files.length === 0) {
      return NextResponse.json({ error: "No submitted files found." }, { status: 404 });
    }

    const baseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

    // Download all files and add to ZIP
    const zip = new JSZip();

    await Promise.all(
      files.map(async (file) => {
        try {
          const fileUrl = `${baseUrl}/${file.s3_object_key}`;
          const response = await fetch(fileUrl);
          if (!response.ok) {
            console.warn(`Could not fetch file: ${file.file_name}`);
            return;
          }
          const buffer = await response.arrayBuffer();
          // Folder structure: ComponentName/SectionName/faculty_filename
          const folderPath = `${file.component_name}/${file.section_name}`;
          const safeFileName = `${file.faculty_name.replace(/[^a-zA-Z0-9]/g, "_")}_${file.file_name}`;
          zip.folder(folderPath)?.file(safeFileName, buffer);
        } catch (err) {
          console.warn(`Failed to add file ${file.file_name}:`, err);
        }
      })
    );

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    // Upload ZIP to R2
    const timestamp = new Date().toISOString().split("T")[0];
    const zipKey = buildR2Key(`bulk-export-${offering_id}-${timestamp}.zip`);
    const zipUrl = await uploadPdfToR2({
      key: zipKey,
      body: zipBuffer,
      contentType: "application/zip",
    });

    return NextResponse.json({
      success: true,
      zip_url: zipUrl,
      file_count: files.length,
    });
  } catch (err) {
    console.error("ZIP generation error:", err);
    return NextResponse.json({ error: "Failed to generate ZIP." }, { status: 500 });
  }
}
