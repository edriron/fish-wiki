export default function TankViewLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-4" />

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-9 w-20 bg-slate-100 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
          >
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-6 w-10 bg-slate-300 dark:bg-slate-600 rounded" />
          </div>
        ))}
      </div>

      {/* Content rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
          >
            <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-28 bg-slate-100 dark:bg-slate-700/50 rounded" />
            </div>
            <div className="h-6 w-8 bg-slate-100 dark:bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
