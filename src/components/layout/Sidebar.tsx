import Link from "next/link";
import { type LucideIcon } from "lucide-react";

export type SidebarItem = {
  label: string;
  href?: string;
  active?: boolean;
  icon?: LucideIcon;
  variant?: "default" | "faculty" | "coordinator" | "audit";
};

export type SidebarNote = {
  title: string;
  body: string;
};

const defaultItems: SidebarItem[] = [];

const defaultNote: SidebarNote = {
  title: "CourseFlow Portal",
  body: "Coordinate courses, sections, submissions, and reports across every term.",
};

export default function Sidebar({
  items = defaultItems,
  note = defaultNote,
}: {
  items?: SidebarItem[];
  note?: SidebarNote;
}) {
  return (
    <aside className="hidden lg:block lg:w-64">
      <div className="panel-card sticky top-6 space-y-6 p-6">
        {items.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
              Navigation
            </p>
            <div className="mt-4 space-y-2 text-sm font-medium">
              {items.map((item) => {
                let classes = item.active
                  ? "rounded-full bg-[var(--color-accent)] px-4 py-2 text-white flex items-center gap-3"
                  : "rounded-full border border-black/10 bg-white px-4 py-2 text-[var(--color-ink)] flex items-center gap-3 hover:bg-gray-50 transition-colors";
                
                if (item.variant === "faculty") {
                  classes = item.active
                    ? "rounded-full bg-[var(--color-accent)] px-4 py-2 text-white flex items-center gap-3"
                    : "rounded-full border border-[var(--color-accent)]/20 bg-white px-4 py-2 text-[var(--color-accent)] flex items-center gap-3 hover:bg-gray-50 transition-colors font-semibold shadow-sm";
                } else if (item.variant === "coordinator") {
                  classes = item.active
                    ? "rounded-full bg-[var(--color-accent)] px-4 py-2 text-white flex items-center gap-3"
                    : "rounded-full border border-[var(--color-accent)]/20 bg-white px-4 py-2 text-[var(--color-accent)] flex items-center gap-3 hover:bg-gray-50 transition-colors font-semibold shadow-sm";
                } else if (item.variant === "audit") {
                  classes = item.active
                    ? "rounded-full bg-[var(--color-accent)] px-4 py-2 text-white flex items-center gap-3"
                    : "rounded-full border border-[var(--color-accent)]/20 bg-white px-4 py-2 text-[var(--color-accent)] flex items-center gap-3 hover:bg-gray-50 transition-colors font-semibold shadow-sm";
                }
                
                const Icon = item.icon;
                
                const content = item.href ? (
                  <Link href={item.href} className={classes}>
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                ) : (
                  <div className={classes}>
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </div>
                );
                return (
                  <div key={item.label}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="rounded-2xl bg-[var(--color-accent-2)]/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {note.title}
          </p>
          <p className="mt-3 text-sm text-[var(--color-ink)]">
            {note.body}
          </p>
        </div>
      </div>
    </aside>
  );
}
