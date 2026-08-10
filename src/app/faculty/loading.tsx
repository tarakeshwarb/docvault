export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-[32px] border border-black/5 bg-white/70" />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-56 rounded-[28px] border border-black/5 bg-white/70" />
        <div className="h-56 rounded-[28px] border border-black/5 bg-white/70" />
      </div>
      <div className="h-56 rounded-[28px] border border-black/5 bg-white/70" />
    </div>
  );
}
