import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FishForm } from "@/components/admin/fish/FishForm";
import { ImageManager } from "@/components/admin/fish/ImageManager";
import { VariantManager } from "@/components/admin/fish/VariantManager";
import { FishDeleteButton } from "@/components/admin/fish/FishDeleteButton";
import type { FishImage, FishVariant } from "@/types/fish";

export default async function EditFishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: fish },
    { data: waterProfiles },
    { data: labels },
    { data: fishLabels },
    { data: images },
    { data: variants },
  ] = await Promise.all([
    supabase.from("fish_species").select("*").eq("id", id).single(),
    supabase.from("water_profiles").select("*").order("name"),
    supabase.from("labels").select("id, name, color, parent_id").order("name"),
    supabase.from("fish_labels").select("label_id").eq("fish_id", id),
    supabase
      .from("fish_images")
      .select("id, image_url, alt_text, caption, variant_id, is_primary, order_index")
      .eq("fish_id", id)
      .order("is_primary", { ascending: false })
      .order("order_index"),
    supabase
      .from("fish_variants")
      .select("id, fish_id, name, description, order_index")
      .eq("fish_id", id)
      .order("order_index"),
  ]);

  if (!fish) notFound();

  const selectedLabelIds = (fishLabels ?? []).map((fl) => fl.label_id as string);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/fish"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Fish Species
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{fish.common_name}</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400 italic text-sm">{fish.scientific_name}</p>
          </div>
          <FishDeleteButton
            fishId={fish.id}
            fishName={fish.common_name}
            redirectAfter
          />
        </div>
      </div>

      {/* Main form */}
      <FishForm
        fish={fish}
        waterProfiles={waterProfiles ?? []}
        allLabels={labels ?? []}
        selectedLabelIds={selectedLabelIds}
      />

      {/* Images section */}
      <section className="mt-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Images
          </h2>
        </div>
        <div className="px-6 py-5">
          <ImageManager
            fishId={fish.id}
            scientificName={fish.scientific_name ?? ""}
            images={(images ?? []) as FishImage[]}
            variants={(variants ?? []) as FishVariant[]}
          />
        </div>
      </section>

      {/* Variants section */}
      <section className="mt-6 mb-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Variants
            <span className="ml-2 font-normal text-slate-400 dark:text-slate-500 text-xs normal-case">
              Color or pattern variants of this species
            </span>
          </h2>
        </div>
        <div className="px-6 py-5">
          <VariantManager
            fishId={fish.id}
            variants={(variants ?? []) as FishVariant[]}
            images={(images ?? []) as FishImage[]}
          />
        </div>
      </section>
    </div>
  );
}
