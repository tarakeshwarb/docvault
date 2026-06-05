import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, Users, BookOpen, Layers, Calendar, Settings, Archive } from "lucide-react";
import { redirect } from "next/navigation";
import { getDashboardPathForRole, getFacultySession } from "@/lib/auth";

const adminSidebarItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Academic Years", href: "/admin/academic-years", icon: Calendar },
  { label: "Semesters", href: "/admin/semesters", icon: Layers },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Course Offerings", href: "/admin/offerings", icon: BookOpen },
  { label: "Faculty Directory", href: "/admin/faculty", icon: Users },
];

const adminSidebarNote = {
  title: "Admin Tools",
  body: "Manage institutional configuration and academic term setups.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFacultySession();
  if (!session) {
    redirect("/");
  }

  if (session.role !== "admin") {
    redirect(getDashboardPathForRole(session.role));
  }

  return (
    <AppShell sidebarItems={adminSidebarItems} sidebarNote={adminSidebarNote}>
      {children}
    </AppShell>
  );
}
