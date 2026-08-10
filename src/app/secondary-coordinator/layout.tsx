import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, ClipboardList, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { queryDb } from "@/lib/db";

import { type SidebarItem } from "@/components/layout/Sidebar";

const secondaryCoordinatorSidebarItems: SidebarItem[] = [
  { label: "My Assigned Courses", href: "/secondary-coordinator", icon: LayoutDashboard, variant: "coordinator" },
  { label: "Faculty Assign", href: "#faculty-assignments", icon: Users },
  { label: "Documents", href: "#document-requirements", icon: ClipboardList },
];

const coordinatorSidebarNote = {
  title: "Secondary Coordinator Portal",
  body: "View course offerings, faculty assignments, and document requirements.",
};

export default async function SecondaryCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  if (session.role !== "admin") {
    // Check if assigned as secondary coordinator
    try {
      const secondaryRows = await queryDb<{ count: string }>(
        `SELECT COUNT(*) AS count 
         FROM public.secondary_coordinator_assignment sca
         JOIN public.course_offering co ON sca.offering_id = co.offering_id
         JOIN public.semester_master sm ON co.semester_id = sm.semester_id
         WHERE sca.faculty_id = $1 AND sm.is_active = true`,
        [session.faculty_id]
      );
      if (Number(secondaryRows[0]?.count ?? 0) === 0) {
        redirect("/"); // Send back to login if they lost access
      }
    } catch (error) {
      redirect("/"); // Table doesn't exist, send back to login
    }
  }

  return (
    <AppShell
      sidebarItems={secondaryCoordinatorSidebarItems}
      sidebarNote={coordinatorSidebarNote}
    >
      {children}
    </AppShell>
  );
}
