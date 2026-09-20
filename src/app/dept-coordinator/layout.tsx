import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, ClipboardList, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { getCoordinatorOfferings } from "./actions";

import { type SidebarItem } from "@/components/layout/Sidebar";

const coordinatorSidebarItems: SidebarItem[] = [
  { label: "My Courses", href: "/dept-coordinator", icon: LayoutDashboard, variant: "coordinator" },
  { label: "Documents", href: "#document-requirements", icon: ClipboardList },
];

const coordinatorSidebarNote = {
  title: "Dept Coordinator Portal",
  body: "Manage your assigned courses, add requirements, and monitor faculty submissions.",
};

export default async function DeptCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  // Strict role isolation: only dept_coordinator, admin, and developer can access this portal
  if (session.role !== "dept_coordinator" && session.role !== "admin" && session.role !== "developer") {
    redirect("/");
  }

  // Double-check they still have an active offering
  if (session.role !== "admin" && session.role !== "developer") {
    const offerings = await getCoordinatorOfferings(session.faculty_id);
    if (offerings.length === 0) {
      redirect("/"); // Send back to login if they lost access
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
