import { PublicNav } from "@/components/public/PublicNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Fish Wiki. All rights reserved.</p>
          <p>A comprehensive guide to aquatic life.</p>
        </div>
      </footer>
    </div>
  );
}
