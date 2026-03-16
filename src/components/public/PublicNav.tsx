"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UserRound,
  LogOut,
  Waves,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Logo } from "../icons/Logo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const initial = displayName.charAt(0).toUpperCase();

  // While auth is loading, show a neutral ghost icon (no flash of wrong state)
  if (authLoading) {
    return (
      <div className="h-9 w-9 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 pointer-events-none">
        <UserRound className="h-5 w-5" />
      </div>
    );
  }

  if (!user) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-9 w-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Account"
        >
          <UserRound className="h-5 w-5" />
        </button>

        {open && mounted && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-50">
            <div className="p-1">
              <Link
                href="/my-tanks/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Waves className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                My Tanks
              </Link>
            </div>
            <div className="p-1 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full bg-teal-600 hover:bg-teal-700 flex items-center justify-center text-white text-sm font-semibold transition-colors shadow-sm"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-50">
          {/* Greeting */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              Hello, {displayName}
            </p>
          </div>

          {/* Links */}
          <div className="p-1">
            <Link
              href="/my-tanks"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Waves className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              My Tanks
            </Link>

            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>

          {/* Logout */}
          <div className="p-1 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicNav() {
  const pathname = usePathname();

  const links = [{ href: "/wiki", label: "Wiki", showActive: true }];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 hover:text-teal-700 transition-colors dark:text-slate-100 dark:hover:text-teal-400"
        >
          <Logo />
          Fish Wiki
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                link.showActive && pathname.startsWith(link.href.split("?")[0])
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              )}
            >
              {link.label}
            </Link>
          ))}
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}
