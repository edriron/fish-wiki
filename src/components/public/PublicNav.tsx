"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fish } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/public/ThemeToggle";

export function PublicNav() {
  const pathname = usePathname();

  const links = [
    { href: "/wiki",    label: "Wiki",   showActive: false },
    { href: "/wiki?q=", label: "Search", showActive: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 hover:text-teal-700 transition-colors dark:text-slate-100 dark:hover:text-teal-400"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Fish className="h-5 w-5" />
          </div>
          Fish Wiki
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                link.showActive && pathname === link.href.split("?")[0]
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
