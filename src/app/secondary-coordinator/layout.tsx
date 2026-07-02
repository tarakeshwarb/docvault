import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, ClipboardList, UserSquare2, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getDashboardPathForRole, getFacultySession } from "@/lib/auth";
import { queryDb } from "@/lib/db";

import { type SidebarItem } from "@/components/layout/Sidebar";

const coordinatorSidebarItems: SidebarItem[] = [
  { label: "My Courses", href: "/secondary-coordinator", icon: LayoutDashboard, variant: "coordinator" },
  { label: "Faculty Assign", href: "#faculty-assignments", icon: Users },
  { label: "Documents", href: "#document-requirements", icon: ClipboardList },
  { label: "Faculty Portal", href: "/faculty", icon: UserSquare2, variant: "faculty" },
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
        redirect("/faculty");
      }
    } catch (error) {
      // Table doesn't exist, redirect to faculty
      redirect("/faculty");
    }
  }

  return (
    <AppShell
      sidebarItems={coordinatorSidebarItems}
      sidebarNote={coordinatorSidebarNote}
    >
      {children}
    </AppShell>
  );
}
