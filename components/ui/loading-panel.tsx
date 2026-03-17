export function LoadingPanel() {
  return (
    <div className="space-y-6">
      <div className="panel loading-shimmer rounded-2xl px-6 py-6">
        <div className="h-3 w-28 rounded bg-white/8" />
        <div className="mt-4 h-8 w-72 rounded bg-white/8" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-white/8" />
        <div className="mt-2 h-4 w-full max-w-xl rounded bg-white/8" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel loading-shimmer rounded-2xl px-6 py-6">
          <div className="h-5 w-40 rounded bg-white/8" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="h-28 rounded-xl bg-white/8" />
            <div className="h-28 rounded-xl bg-white/8" />
            <div className="h-28 rounded-xl bg-white/8" />
          </div>
        </div>
        <div className="panel loading-shimmer rounded-2xl px-6 py-6">
          <div className="h-5 w-32 rounded bg-white/8" />
          <div className="mt-5 space-y-3">
            <div className="h-20 rounded-xl bg-white/8" />
            <div className="h-20 rounded-xl bg-white/8" />
            <div className="h-20 rounded-xl bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  );
}
