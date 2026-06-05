import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, Upload, History, BookOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { getCoordinatorOfferings } from "../course-coordinator/actions";

import { type SidebarItem } from "@/components/layout/Sidebar";

const facultySidebarItems: SidebarItem[] = [
  { label: "My Dashboard", href: "/faculty", icon: LayoutDashboard, variant: "faculty" },
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

  return (
    <AppShell sidebarItems={items} sidebarNote={facultySidebarNote}>
      {children}
    </AppShell>
  );
}
