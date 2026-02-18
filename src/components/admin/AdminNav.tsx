"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fish, Tag, Droplets, LayoutDashboard, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen bg-slate-900 sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-white font-bold text-base"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600">
            <Fish className="h-4 w-4 text-white" />
          </div>
          Fish Wiki Admin
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
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
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          View Site
        </Link>
      </div>
    </aside>
  );
}
