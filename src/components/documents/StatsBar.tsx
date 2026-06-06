import type { DashboardStats } from "@/types/document";
import { formatDate } from "@/lib/utils";

export default function StatsBar({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="panel-card p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Total files
        </p>
        <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
          {stats.total}
        </p>
      </div>
      <div className="panel-card p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Categories
        </p>
        <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
          {stats.categories}
        </p>
      </div>
      <div className="panel-card p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Latest upload
        </p>
        <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
          {formatDate(stats.latestUpload)}
        </p>
      </div>
    </div>
  );
}
