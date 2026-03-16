import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TankEditForm } from "@/components/tanks/TankEditForm";
import type { TankFishItem, TankPlantItem, FishBasic, PlantBasic } from "@/types/tank";

export default async function TankEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/my-tanks/login");

  const [
    { data: tank },
    { data: tankFishRaw },
    { data: tankPlantsRaw },
    { data: allFishRaw },
    { data: allPlantsRaw },
  ] = await Promise.all([
    supabase
      .from("tanks")
      .select("id, name, description, volume_liters, tank_type")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("tank_fish")
      .select(
        `id, tank_id, fish_id, quantity, quantity_male, quantity_female,
        fish_species(id, slug, common_name, scientific_name,
          fish_images(image_url, is_primary))`,
      )
      .eq("tank_id", id),

    supabase
      .from("tank_plants")
      .select(
        `id, tank_id, plant_id, quantity,
        plant_species(id, slug, common_name, scientific_name, type,
          plant_images(image_url, is_primary))`,
      )
      .eq("tank_id", id),

    supabase
      .from("fish_species")
      .select("id, slug, common_name, scientific_name, fish_images(image_url, is_primary)")
      .eq("published", true)
      .order("common_name"),

    supabase
      .from("plant_species")
      .select("id, slug, common_name, scientific_name, type, plant_images(image_url, is_primary)")
      .eq("published", true)
      .order("common_name"),
  ]);

  if (!tank) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <Link
        href={`/my-tanks/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to tank
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Edit Tank</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Update tank details and manage your fish and plants.
      </p>

      <TankEditForm
        tankId={id}
        tankName={tank.name}
        tankDescription={tank.description}
        tankVolume={tank.volume_liters}
        tankType={(tank as any).tank_type ?? "freshwater"}
        initialFish={(tankFishRaw as unknown as TankFishItem[]) ?? []}
        initialPlants={(tankPlantsRaw as unknown as TankPlantItem[]) ?? []}
        allFish={(allFishRaw as unknown as FishBasic[]) ?? []}
        allPlants={(allPlantsRaw as unknown as PlantBasic[]) ?? []}
      />
    </div>
  );
}
