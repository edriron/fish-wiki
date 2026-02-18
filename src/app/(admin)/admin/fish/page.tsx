import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublishToggle } from "@/components/admin/fish/PublishToggle";
import { FishDeleteButton } from "@/components/admin/fish/FishDeleteButton";

export default async function AdminFishPage() {
  const supabase = await createClient();

  const { data: fish } = await supabase
    .from("fish_species")
    .select("id, slug, common_name, scientific_name, water_type, difficulty_level, published")
    .order("common_name");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fish Species</h1>
          <p className="mt-1 text-slate-500">
            {fish?.length ?? 0} species total
          </p>
        </div>
        <Link
          href="/admin/fish/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Species
        </Link>
      </div>

      {!fish || fish.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <p className="text-slate-400 mb-3">No fish species yet.</p>
          <Link
            href="/admin/fish/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Species
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Common Name</th>
                <th className="px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">
                  Scientific Name
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                  Water Type
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">
                  Difficulty
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fish.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{f.common_name}</div>
                    <div className="text-xs text-slate-400 sm:hidden italic">
                      {f.scientific_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-500 italic">
                    {f.scientific_name}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {f.water_type ? (
                      <span className="capitalize text-slate-600">{f.water_type}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {f.difficulty_level ? (
                      <span className="capitalize text-slate-600">
                        {f.difficulty_level}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PublishToggle fishId={f.id} published={f.published} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/fish/${f.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <FishDeleteButton
                        fishId={f.id}
                        fishName={f.common_name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
