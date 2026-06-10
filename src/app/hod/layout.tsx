import { redirect } from "next/navigation";
import { getFacultySession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function HodLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession();
  if (!session) redirect("/");
  if (session.role !== "hod" && session.role !== "admin") redirect("/");

  return <AppShell session={session}>{children}</AppShell>;
}
