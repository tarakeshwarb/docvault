import { type LucideIcon, KeyRound } from "lucide-react";
import Link from "next/link";
import SidebarLink from "./SidebarLink";

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
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <SidebarLink item={{ href: item.href, label: item.label, active: item.active, variant: item.variant }}>
                      {Icon && <Icon className="w-4 h-4" />}
                    </SidebarLink>
                  </div>
                );
              })}

              {/* Change Password — always appended under nav items */}
              <Link
                href="/change-password"
                prefetch={false}
                className="flex w-full items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-gray-50"
              >
                <KeyRound className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                Change Password
              </Link>
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
