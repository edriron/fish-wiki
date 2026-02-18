import { PublicNav } from "@/components/public/PublicNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Fish Wiki. All rights reserved.</p>
          <p>A comprehensive guide to aquatic life.</p>
        </div>
      </footer>
    </div>
  );
}
