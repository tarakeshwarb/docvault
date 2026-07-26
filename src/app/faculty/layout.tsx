import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";

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

  // Cross-portal navigation removed. Access is strictly isolated by selected role.
  const items = [...facultySidebarItems];

  return (
    <AppShell sidebarItems={items} sidebarNote={facultySidebarNote}>
      {children}
    </AppShell>
  );
}
