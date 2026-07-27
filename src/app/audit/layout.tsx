import AppShell from "@/components/layout/AppShell";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { type SidebarItem } from "@/components/layout/Sidebar";

const auditSidebarNote = {
  title: "Audit Portal",
  body: "Monitor institutional compliance and track all system actions in real-time.",
};

export default async function AuditLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  // Must be logged in explicitly as audit or admin
  if (session.role !== "audit" && session.role !== "admin") {
    redirect("/");
  }

  // Build sidebar items
  const items: SidebarItem[] = [
    { label: "Audit Trail", href: "/audit", icon: ShieldCheck, active: true },
  ];

  return (
    <AppShell sidebarItems={items} sidebarNote={auditSidebarNote}>
      {children}
    </AppShell>
  );
}
