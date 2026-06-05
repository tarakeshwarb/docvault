export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center animate-pulse">
      <div className="h-4 w-32 rounded-full bg-white/80" />
      <div className="h-10 w-2/3 rounded-full bg-white/80" />
      <div className="h-4 w-1/2 rounded-full bg-white/80" />
    </div>
  );
}
