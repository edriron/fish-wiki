import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Waves } from "lucide-react";
import { TankCard } from "@/components/tanks/TankCard";
import type { TankWithCounts } from "@/types/tank";

export default async function MyTanksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/my-tanks/login");

  const { data: tanks } = await supabase
    .from("tanks")
    .select("id, name, description, volume_liters, tank_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const tankIds = tanks?.map((t) => t.id) ?? [];
  const [{ data: fishRows }, { data: plantRows }] = await Promise.all([
    tankIds.length > 0
      ? supabase.from("tank_fish").select("tank_id, quantity").in("tank_id", tankIds)
      : Promise.resolve({ data: [] }),
    tankIds.length > 0
      ? supabase.from("tank_plants").select("tank_id").in("tank_id", tankIds)
      : Promise.resolve({ data: [] }),
  ]);

  const fishMap = new Map<string, { species: number; total: number }>();
  for (const r of fishRows ?? []) {
    const cur = fishMap.get(r.tank_id) ?? { species: 0, total: 0 };
    fishMap.set(r.tank_id, { species: cur.species + 1, total: cur.total + (r.quantity ?? 0) });
  }
  const plantMap = new Map<string, number>();
  for (const r of plantRows ?? []) plantMap.set(r.tank_id, (plantMap.get(r.tank_id) ?? 0) + 1);

  const tanksWithCounts: TankWithCounts[] = (tanks ?? []).map((t) => ({
    ...t,
    fishSpeciesCount: fishMap.get(t.id)?.species ?? 0,
    fishTotalCount: fishMap.get(t.id)?.total ?? 0,
    plantSpeciesCount: plantMap.get(t.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Tanks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {tanksWithCounts.length} {tanksWithCounts.length === 1 ? "tank" : "tanks"}
          </p>
        </div>
        <Link
          href="/my-tanks/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Tank
        </Link>
      </div>

      {tanksWithCounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tanksWithCounts.map((tank) => (
            <TankCard key={tank.id} tank={tank} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/40 mb-4">
            <Waves className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No tanks yet</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            Create your first tank to start tracking your aquarium.
          </p>
          <Link
            href="/my-tanks/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Tank
          </Link>
        </div>
      )}
    </div>
  );
}
