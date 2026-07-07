import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, Upload, History, BookOpen, ShieldCheck, Megaphone } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { getCoordinatorOfferings } from "../course-coordinator/actions";
import { queryDb } from "@/lib/db";

import { type SidebarItem } from "@/components/layout/Sidebar";

const facultySidebarItems: SidebarItem[] = [
  { label: "My Dashboard", href: "/faculty", icon: LayoutDashboard, variant: "faculty" },
  { label: "Course Materials", href: "#broadcasts", icon: Megaphone },
];

const facultySidebarNote = {
  title: "Faculty Portal",
  body: "Upload required documents and track your submission progress.",
};

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  const offerings = await getCoordinatorOfferings(session.faculty_id);
  
  const items = [...facultySidebarItems];
  if (offerings.length > 0) {
    items.push({
      label: "Coordinator Portal",
      href: "/course-coordinator",
      icon: BookOpen,
      variant: "coordinator" as const,
    });
  }

  // Check if faculty is assigned as audit professor
  try {
    const auditRows = await queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count 
       FROM public.audit_assignment aa
       JOIN public.course_offering co ON aa.offering_id = co.offering_id
       JOIN public.semester_master sm ON co.semester_id = sm.semester_id
       WHERE aa.faculty_id = $1 AND sm.is_active = true`,
      [session.faculty_id]
    );
    if (Number(auditRows[0]?.count ?? 0) > 0) {
      items.push({
        label: "Audit Portal",
        href: "/audit",
        icon: ShieldCheck,
        variant: "audit" as const,
      });
    }
  } catch (error) {
    // Table doesn't exist, skip audit check
  }

  return (
    <AppShell sidebarItems={items} sidebarNote={facultySidebarNote}>
      {children}
    </AppShell>
  );
}
