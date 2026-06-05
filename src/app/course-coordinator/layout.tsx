import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, ClipboardList, UserSquare2, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getDashboardPathForRole, getFacultySession } from "@/lib/auth";
import { getCoordinatorOfferings } from "./actions";

const coordinatorSidebarItems = [
  { label: "My Courses", href: "/course-coordinator", icon: LayoutDashboard, variant: "coordinator" as const },
  { label: "Faculty Assign", href: "#faculty-assignments", icon: Users },
  { label: "Documents", href: "#document-requirements", icon: ClipboardList },
  { label: "Faculty Portal", href: "/faculty", icon: UserSquare2, variant: "faculty" as const },
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

  if (session.role === "faculty") {
    const offerings = await getCoordinatorOfferings(session.faculty_id);
    if (offerings.length === 0) {
      redirect(getDashboardPathForRole(session.role));
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
