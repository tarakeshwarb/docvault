import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-[32px] border border-black/5 bg-white/70" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 rounded-[22px] border border-black/5 bg-white/70" />
          <div className="h-24 rounded-[22px] border border-black/5 bg-white/70" />
          <div className="h-24 rounded-[22px] border border-black/5 bg-white/70" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`card-${index}`}
              className="h-48 rounded-[24px] border border-black/5 bg-white/70"
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
