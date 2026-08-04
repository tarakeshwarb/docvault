import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { getFacultySession } from "@/lib/auth";
import {
  getComponentsWithAnalysis,
  buildConsolidatedInputs,
} from "@/lib/result-analysis-data";
import { ResultAnalysisChart } from "@/components/coordinator/ResultAnalysisChart";
import { RaDownloadButtons } from "@/components/coordinator/RaDownloadButtons";

export const dynamic = "force-dynamic";

const RANGE_LABELS = ["0-49", "50-59", "60-69", "70-79", "80-89", "90-100"];

export default async function CoordinatorResultAnalysisPage({
  params,
}: {
  params: Promise<{ offering_id: string }>;
}) {
  const { offering_id } = await params;
  const session = await getFacultySession();
  if (!session) return null;

  const components = await getComponentsWithAnalysis(offering_id);
  const blocks = await Promise.all(
    components.map(async (c) => ({
      component_id: c.component_id,
      component_name: c.component_name,
      sections: await buildConsolidatedInputs(offering_id, c.component_id),
    }))
  );

  const first = blocks.find((b) => b.sections.length > 0)?.sections[0];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/course-coordinator/${offering_id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--color-accent)]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to course
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          <BarChart3 className="w-6 h-6 text-[var(--color-accent)]" />
          Result Analysis
        </h1>
        {first && (
          <p className="mt-1 text-sm text-gray-500">
            {first.courseCode} · {first.courseName} · {first.semester} {first.academicYear}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Consolidated across all sections. Faculty enter their section&apos;s numbers; totals and the graph update here.
        </p>
      </div>

      {blocks.length === 0 ? (
        <div className="panel-card border-dashed border-gray-300 p-8 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h2 className="font-semibold text-gray-600">No result analysis yet</h2>
          <p className="text-sm text-gray-400 mt-1">
            Once faculty save their section result analysis, the consolidated view appears here.
          </p>
        </div>
      ) : (
        blocks.map((block) => {
          const totals = new Array(6).fill(0);
          let grandStrength = 0;
          let grandAttended = 0;
          let grandAbsent = 0;
          block.sections.forEach((s) => {
            const r = s.ranges;
            for (let i = 0; i < 6; i++) totals[i] += Number(r[i] ?? 0);
            grandStrength += s.totalStrength;
            grandAbsent += s.totalAbsentees;
            grandAttended += Math.max(0, s.totalStrength - s.totalAbsentees);
          });
          const failures = totals[0];
          const passPct = grandStrength > 0 ? ((grandStrength - failures) / grandStrength) * 100 : 0;
          const chartData = RANGE_LABELS.map((range, i) => ({ range, count: totals[i] }));

          return (
            <div key={block.component_id} className="panel-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">{block.component_name}</h2>
                <RaDownloadButtons
                  offeringId={offering_id}
                  componentId={block.component_id}
                  courseCode={first?.courseCode ?? "course"}
                  component={block.component_name}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Strength", value: grandStrength },
                  { label: "Present", value: grandAttended },
                  { label: "Failures (0-49)", value: failures },
                  { label: "Pass %", value: `${passPct.toFixed(2)}%` },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                    <p className="mt-1 text-xl font-semibold text-[var(--color-ink)]">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="overflow-x-auto rounded-lg border border-black/5">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/70 text-gray-500 border-b border-black/5">
                      <tr>
                        <th className="px-3 py-2">Staff</th>
                        <th className="px-3 py-2">Sec</th>
                        {RANGE_LABELS.map((r) => (
                          <th key={r} className="px-2 py-2 text-center">{r}</th>
                        ))}
                        <th className="px-2 py-2 text-center">Str</th>
                        <th className="px-2 py-2 text-center">Abs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {block.sections.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 whitespace-nowrap">{s.staffName}</td>
                          <td className="px-3 py-2">{s.yearSection}</td>
                          {s.ranges.map((v, i) => (
                            <td key={i} className="px-2 py-2 text-center">{v}</td>
                          ))}
                          <td className="px-2 py-2 text-center">{s.totalStrength}</td>
                          <td className="px-2 py-2 text-center">{s.totalAbsentees}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-semibold">
                        <td className="px-3 py-2" colSpan={2}>TOTAL</td>
                        {totals.map((v, i) => (
                          <td key={i} className="px-2 py-2 text-center">{v}</td>
                        ))}
                        <td className="px-2 py-2 text-center">{grandStrength}</td>
                        <td className="px-2 py-2 text-center">{grandAbsent}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <p className="mb-1 text-center text-sm font-medium text-gray-600">Total vs. Range of Marks</p>
                  <ResultAnalysisChart data={chartData} />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
