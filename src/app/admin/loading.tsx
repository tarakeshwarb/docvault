export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-[32px] border border-black/5 bg-white/70" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 rounded-[22px] border border-black/5 bg-white/70" />
        <div className="h-24 rounded-[22px] border border-black/5 bg-white/70" />
        <div className="h-24 rounded-[22px] border border-black/5 bg-white/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="h-64 rounded-[28px] border border-black/5 bg-white/70" />
        <div className="h-64 rounded-[28px] border border-black/5 bg-white/70" />
      </div>
    </div>
  );
}
