import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, ClipboardList, UserSquare2, Users, Megaphone } from "lucide-react";
import { redirect } from "next/navigation";
import { getDashboardPathForRole, getFacultySession } from "@/lib/auth";
import { getCoordinatorOfferings } from "./actions";

import { type SidebarItem } from "@/components/layout/Sidebar";

const coordinatorSidebarItems: SidebarItem[] = [
  { label: "My Courses", href: "/course-coordinator", icon: LayoutDashboard, variant: "coordinator" },
  { label: "Faculty Assign", href: "#faculty-assignments", icon: Users },
  { label: "Documents", href: "#document-requirements", icon: ClipboardList },
  { label: "Faculty Portal", href: "/faculty", icon: UserSquare2, variant: "faculty" },
];

const coordinatorSidebarNote = {
  title: "Faculty Portal",
  body: "Note: You need to be assigned as a faculty for a section before you can view your faculty dashboard.",
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

  if (session.role !== "admin") {
    const offerings = await getCoordinatorOfferings(session.faculty_id);
    if (offerings.length === 0) {
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
