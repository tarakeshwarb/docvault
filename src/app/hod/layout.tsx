import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";

export default async function HodLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession();
  if (!session) redirect("/");
  
  // Only HOD and developer roles allowed
  if (session.role !== "hod" && session.role !== "developer") redirect("/");

  return <AppShell>{children}</AppShell>;
}