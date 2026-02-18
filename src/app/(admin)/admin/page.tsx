import Link from "next/link";
import { Fish, Tag, Droplets, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ count: fishCount }, { count: labelsCount }, { count: profilesCount }] =
    await Promise.all([
      supabase.from("fish_species").select("*", { count: "exact", head: true }),
      supabase.from("labels").select("*", { count: "exact", head: true }),
      supabase.from("water_profiles").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    {
      label: "Fish Species",
      count: fishCount ?? 0,
      icon: Fish,
      href: "/admin/fish",
      newHref: "/admin/fish/new",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Labels",
      count: labelsCount ?? 0,
      icon: Tag,
      href: "/admin/labels",
      newHref: "/admin/labels/new",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Water Profiles",
      count: profilesCount ?? 0,
      icon: Droplets,
      href: "/admin/water-profiles",
      newHref: "/admin/water-profiles/new",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Manage your fish wiki content.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <Link
                href={stat.newHref}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                New
              </Link>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{stat.count}</p>
              <Link
                href={stat.href}
                className="mt-1 text-sm text-slate-500 hover:text-teal-700 transition-colors"
              >
                {stat.label} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/fish/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Fish Species
          </Link>
          <Link
            href="/admin/water-profiles/new"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Water Profile
          </Link>
          <Link
            href="/admin/labels/new"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Label
          </Link>
        </div>
      </div>
    </div>
  );
}
