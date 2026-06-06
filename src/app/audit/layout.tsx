import AppShell from "@/components/layout/AppShell";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";

const auditSidebarItems = [
  { label: "Audit Trail", href: "/audit", icon: ShieldCheck, active: true },
];

const auditSidebarNote = {
  title: "Audit Portal",
  body: "Monitor institutional compliance and track all system actions in real-time.",
};

export default async function AuditLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  // Only allow the designated auditor ID (or admin) to access the audit logs
  if (Number(session.faculty_id) !== 100174 && session.role !== "admin") {
    const { getDashboardPathForRole } = await import("@/lib/auth");
    redirect(getDashboardPathForRole(session.role));
  }

  return (
    <AppShell sidebarItems={auditSidebarItems} sidebarNote={auditSidebarNote}>
      {children}
    </AppShell>
  );
}
