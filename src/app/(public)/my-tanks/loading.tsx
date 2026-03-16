export default function MyTanksLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded mt-2" />
        </div>
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
          >
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700" />
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-14 bg-slate-100 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-700/50 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-700/50 rounded" />
              <div className="flex gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700/50 rounded" />
                <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700/50 rounded" />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <div className="flex-1 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-9 w-10 bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
