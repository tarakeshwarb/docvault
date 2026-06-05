import Header from "./Header";
import Sidebar, { type SidebarItem, type SidebarNote } from "./Sidebar";

export default function AppShell({
  children,
  sidebarItems,
  sidebarNote,
}: {
  children: React.ReactNode;
  sidebarItems?: SidebarItem[];
  sidebarNote?: SidebarNote;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-2 pb-16 pt-4 sm:px-3 lg:px-2 lg:flex-row">
        <Sidebar items={sidebarItems} note={sidebarNote} />
        <main className="flex-1 space-y-10">{children}</main>
      </div>
    </div>
  );
}
