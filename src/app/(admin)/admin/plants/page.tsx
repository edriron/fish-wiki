import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlantTable } from "@/components/admin/plants/PlantTable";

export default async function AdminPlantsPage() {
  const supabase = await createClient();

  const { data: plants } = await supabase
    .from("plant_species")
    .select("id, slug, common_name, scientific_name, type, water_type, difficulty, published, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Plants &amp; Corals</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {plants?.length ?? 0} entries total
          </p>
        </div>
        <Link
          href="/admin/plants/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Species
        </Link>
      </div>

      {!plants || plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-3">No plants or corals yet.</p>
          <Link href="/admin/plants/new" className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors">
            <Plus className="h-4 w-4" />Add First Species
          </Link>
        </div>
      ) : (
        <PlantTable plants={plants} />
      )}
    </div>
  );
}
