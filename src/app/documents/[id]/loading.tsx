import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 rounded-full bg-white/70" />
        <div className="rounded-[28px] border border-black/5 bg-white/70 p-6">
          <div className="h-4 w-28 rounded-full bg-white/80" />
          <div className="mt-4 h-8 w-2/3 rounded-full bg-white/80" />
          <div className="mt-4 h-4 w-full rounded-full bg-white/80" />
        </div>
        <div className="h-[70vh] rounded-[28px] border border-black/5 bg-white/70" />
      </div>
    </AppShell>
  );
}
