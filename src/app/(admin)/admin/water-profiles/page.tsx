import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WaterProfileDeleteButton } from "@/components/admin/water-profiles/WaterProfileDeleteButton";

function fmt(min: number | null, max: number | null, unit: string) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${min}–${max} ${unit}`;
  return `${min ?? max} ${unit}`;
}

export default async function AdminWaterProfilesPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("water_profiles")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Water Profiles</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {profiles?.length ?? 0} profiles total
          </p>
        </div>
        <Link
          href="/admin/water-profiles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Profile
        </Link>
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-3">No water profiles yet.</p>
          <Link
            href="/admin/water-profiles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Profile
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-155">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                  Temp
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                  pH
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">
                  GH
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">
                  KH
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-50">
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600 dark:text-slate-400">
                    {fmt(p.temp_min, p.temp_max, "°C")}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600 dark:text-slate-400">
                    {fmt(p.ph_min, p.ph_max, "")}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400">
                    {fmt(p.gh_min, p.gh_max, "dGH")}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400">
                    {fmt(p.kh_min, p.kh_max, "dKH")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/water-profiles/${p.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <WaterProfileDeleteButton
                        profileId={p.id}
                        profileName={p.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
