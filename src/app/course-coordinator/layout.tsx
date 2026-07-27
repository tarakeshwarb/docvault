import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, ClipboardList, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { getCoordinatorOfferings } from "./actions";

import { type SidebarItem } from "@/components/layout/Sidebar";

const coordinatorSidebarItems: SidebarItem[] = [
  { label: "My Courses", href: "/course-coordinator", icon: LayoutDashboard, variant: "coordinator" },
  { label: "Faculty Assign", href: "#faculty-assignments", icon: Users },
  { label: "Documents", href: "#document-requirements", icon: ClipboardList },
];

const coordinatorSidebarNote = {
  title: "Course Coordinator Portal",
  body: "Manage your assigned courses, add requirements, and monitor faculty submissions.",
};

export default async function CourseCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  // Strict role isolation: only course_coordinator (and admin) can access this portal
  if (session.role !== "course_coordinator" && session.role !== "admin") {
    redirect("/");
  }

  // Double-check they still have an active offering
  if (session.role !== "admin") {
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
