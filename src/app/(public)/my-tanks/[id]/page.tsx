import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Droplets } from "lucide-react";
import { TankView } from "@/components/tanks/TankView";
import type { TankFishItem, TankPlantItem, TankLabel } from "@/types/tank";

export default async function TankViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/my-tanks/login");

  const [{ data: tank }, { data: tankFishRaw }, { data: tankPlantsRaw }, { data: allLabels }] =
    await Promise.all([
      supabase
        .from("tanks")
        .select("id, name, description, volume_liters")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),

      supabase
        .from("tank_fish")
        .select(
          `id, tank_id, fish_id, quantity,
          fish_species(
            id, slug, common_name, scientific_name, water_type, diet, difficulty_level, max_size_cm,
            fish_images(image_url, alt_text, is_primary),
            fish_labels(label_id, labels(id, name, color, parent_id))
          )`,
        )
        .eq("tank_id", id)
        .order("fish_id"),

      supabase
        .from("tank_plants")
        .select(
          `id, tank_id, plant_id, quantity,
          plant_species(
            id, slug, common_name, scientific_name, type, water_type, difficulty, light_requirement,
            plant_images(image_url, alt_text, is_primary)
          )`,
        )
        .eq("tank_id", id)
        .order("plant_id"),

      supabase.from("labels").select("id, name, color, parent_id"),
    ]);

  if (!tank) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/my-tanks"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My Tanks
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              {tank.name}
              {tank.volume_liters && (
                <span className="inline-flex items-center gap-1 text-sm font-normal text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-3 py-1">
                  <Droplets className="h-3.5 w-3.5" />
                  {tank.volume_liters}L
                </span>
              )}
            </h1>
            {tank.description && (
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{tank.description}</p>
            )}
          </div>
          <Link
            href={`/my-tanks/${id}/edit`}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Tank view */}
      <TankView
        tankFish={(tankFishRaw as unknown as TankFishItem[]) ?? []}
        tankPlants={(tankPlantsRaw as unknown as TankPlantItem[]) ?? []}
        allLabels={(allLabels as TankLabel[]) ?? []}
      />
    </div>
  );
}
