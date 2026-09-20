import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";

import { type SidebarItem } from "@/components/layout/Sidebar";

const coordinatorSidebarItems: SidebarItem[] = [
  { label: "Overview", href: "/main-coordinator", icon: LayoutDashboard, variant: "coordinator" },
  { label: "Submissions", href: "/main-coordinator/departments", icon: LayoutDashboard, variant: "coordinator" },
  { label: "Result Analysis", href: "/main-coordinator/result-analysis", icon: BarChart3, variant: "coordinator" },
];

const coordinatorSidebarNote = {
  title: "SOC Coordinator Portal",
  body: "View departments, track faculty submissions, and export result analysis reports.",
};

export default async function MainCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  // Strict role isolation
  if (session.role !== "main_coordinator" && session.role !== "admin" && session.role !== "developer") {
    redirect("/");
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
