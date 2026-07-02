import AppShell from "@/components/layout/AppShell";
import { ShieldCheck, LayoutDashboard, BookOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { queryDb } from "@/lib/db";
import { getCoordinatorOfferings } from "../course-coordinator/actions";
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

  // Allow admin or faculty assigned as audit professor
  let isAuditProfessor = session.role === "admin";
  
  if (!isAuditProfessor) {
    try {
      const auditRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count 
         FROM public.audit_assignment aa
         JOIN public.course_offering co ON aa.offering_id = co.offering_id
         JOIN public.semester_master sm ON co.semester_id = sm.semester_id
         WHERE aa.faculty_id = $1 AND sm.is_active = true`,
        [session.faculty_id]
      );
      isAuditProfessor = Number(auditRows[0]?.count ?? 0) > 0;
    } catch (error) {
      // Table doesn't exist, fall back to role check
      isAuditProfessor = false;
    }
  }

  if (!isAuditProfessor) {
    const { getDashboardPathForRole } = await import("@/lib/auth");
    redirect(getDashboardPathForRole(session.role));
  }

  // Build sidebar items
  const items: SidebarItem[] = [
    { label: "Audit Trail", href: "/audit", icon: ShieldCheck, active: true },
    { label: "Faculty Portal", href: "/faculty", icon: LayoutDashboard, variant: "faculty" as const },
  ];

  // Check if faculty is also a coordinator
  const offerings = await getCoordinatorOfferings(session.faculty_id);
  if (offerings.length > 0) {
    items.push({
      label: "Coordinator Portal",
      href: "/course-coordinator",
      icon: BookOpen,
      variant: "coordinator" as const,
    });
  }

  return (
    <AppShell sidebarItems={items} sidebarNote={auditSidebarNote}>
      {children}
    </AppShell>
  );
}
