import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FishTable } from "@/components/admin/fish/FishTable";

export default async function AdminFishPage() {
  const supabase = await createClient();

  const { data: fish } = await supabase
    .from("fish_species")
    .select("id, slug, common_name, scientific_name, water_type, difficulty_level, published, updated_at");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fish Species</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-3">No fish species yet.</p>
          <Link
            href="/admin/fish/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Species
          </Link>
        </div>
      ) : (
        <FishTable fish={fish} />
      )}
    </div>
  );
}
