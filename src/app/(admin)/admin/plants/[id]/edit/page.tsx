import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlantForm } from "@/components/admin/plants/PlantForm";
import { PlantImageManager } from "@/components/admin/plants/PlantImageManager";
import { Separator } from "@/components/ui/separator";
import type { PlantImage } from "@/types/plant";

export default async function EditPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plant }, { data: imagesRaw }] = await Promise.all([
    supabase.from("plant_species").select("*").eq("id", id).single(),
    supabase
      .from("plant_images")
      .select("id, plant_id, image_url, alt_text, caption, is_primary, order_index")
      .eq("plant_id", id)
      .order("order_index")
      .order("is_primary", { ascending: false }),
  ]);

  if (!plant) notFound();

  const images: PlantImage[] = (imagesRaw ?? []) as PlantImage[];

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/plants" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Plants &amp; Corals
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{plant.common_name}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 italic text-sm">{plant.scientific_name}</p>
      </div>

      <PlantForm plant={plant} />

      <Separator className="my-8" />

      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Images</h2>
        <PlantImageManager
          plantId={plant.id}
          scientificName={plant.scientific_name}
          images={images}
        />
      </section>
    </div>
  );
}
