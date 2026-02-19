"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fish,
  Tag,
  Droplets,
  LayoutDashboard,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/icons/Logo";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface AdminNavProps {
  userName?: string;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/fish", label: "Fish Species", icon: Fish, exact: false },
  { href: "/admin/labels", label: "Labels", icon: Tag, exact: false },
  {
    href: "/admin/water-profiles",
    label: "Water Profiles",
    icon: Droplets,
    exact: false,
  },
];

export function AdminNav({ userName }: AdminNavProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close drawer when navigating
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const isDark = resolvedTheme === "dark";

  const navLinks = navItems.map((item) => {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-teal-600 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  });

  const bottomLinks = (
    <div className="p-3 border-t border-slate-800 space-y-0.5">
      {mounted && (
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          {isDark ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      )}
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        View Site
      </Link>
    </div>
  );

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col h-screen bg-slate-900 dark:bg-slate-950 sticky top-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-800">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-white font-bold text-base"
          >
            <Logo size={28} />
            Fish Wiki Admin
          </Link>
        </div>

        {/* User greeting */}
        {userName && (
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-xs text-slate-500">Hello,</p>
            <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">{navLinks}</nav>

        {bottomLinks}
      </aside>

      {/* ===== MOBILE TOP BAR (fixed) ===== */}
      <div className="fixed top-0 inset-x-0 z-30 h-14 md:hidden flex items-center justify-between px-4 bg-slate-900 dark:bg-slate-950 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/admin"
          className="flex items-center gap-2 text-white font-semibold text-sm"
        >
          <Logo size={24} />
          Fish Wiki
        </Link>

        {mounted ? (
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-7" />
        )}
      </div>

      {/* ===== MOBILE DRAWER ===== */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden flex flex-col bg-slate-900 dark:bg-slate-950 overflow-y-auto shadow-2xl">
            {/* Drawer header */}
            <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white font-bold text-sm"
              >
                <Logo size={28} />
                Fish Wiki Admin
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User greeting */}
            {userName && (
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-xs text-slate-500">Hello,</p>
                <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 py-4 px-3 space-y-0.5">{navLinks}</nav>

            {bottomLinks}
          </div>
        </>
      )}
    </>
  );
}
