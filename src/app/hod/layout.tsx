import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";

export default async function HodLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession();
  if (!session) redirect("/");
  
  // Only HOD role allowed — admin cannot access this page
  if (session.role !== "hod") redirect("/");

  return <AppShell>{children}</AppShell>;
}