import { createPublicClient } from "@/lib/supabase/public";
import { WikiFishList } from "@/components/public/WikiFishList";
import { RecentlyVisited } from "@/components/public/RecentlyVisited";
import type { FishCardData, FishLabel } from "@/types/fish";
import type { PlantCardData } from "@/types/plant";

interface WikiPageProps {
  searchParams: Promise<{
    q?: string;
    label?: string;
    water_type?: string;
    tab?: string;
  }>;
}

export default async function WikiPage({ searchParams }: WikiPageProps) {
  const { q, label, water_type, tab } = await searchParams;
  const supabase = createPublicClient();

  const [{ data: fishRaw }, { data: labelsData }] = await Promise.all([
    supabase
      .from("fish_species")
      .select(
        `id, slug, common_name, scientific_name, water_type, difficulty_level,
         fish_images(image_url, alt_text, is_primary),
         fish_labels(labels(id, name, color, parent_id))`,
      )
      .eq("published", true)
      .order("common_name"),
    supabase.from("labels").select("id, name, color, parent_id").order("name"),
  ]);

  const fish: FishCardData[] = (fishRaw ?? []).map((f) => {
    const images =
      (f.fish_images as Array<{
        image_url: string;
        alt_text: string | null;
        is_primary: boolean;
      }>) ?? [];
    const primaryImage = images.find((img) => img.is_primary) ?? images[0] ?? null;

    const rawLabels = f.fish_labels as unknown as Array<{
      labels: FishLabel | FishLabel[] | null;
    }>;
    const labels: FishLabel[] =
      rawLabels?.flatMap((fl) => {
        const l = fl.labels;
        if (!l) return [];
        return Array.isArray(l) ? l : [l];
      }) ?? [];

    return {
      id: f.id,
      slug: f.slug,
      common_name: f.common_name,
      scientific_name: f.scientific_name,
      water_type: f.water_type,
      difficulty_level: f.difficulty_level,
      primary_image: primaryImage?.image_url ?? null,
      primary_image_alt: primaryImage?.alt_text ?? null,
      labels,
    };
  });

  const labels = (labelsData ?? []) as FishLabel[];

  // Fetch plants (safe fallback if table doesn't exist yet)
  let plants: PlantCardData[] = [];
  try {
    const { data: plantsRaw } = await supabase
      .from("plant_species")
      .select("id, slug, common_name, scientific_name, type, water_type, difficulty, light_requirement, plant_images(image_url, is_primary)")
      .eq("published", true)
      .order("common_name");
    plants = (plantsRaw ?? []).map((p) => {
      const imgs = (p.plant_images as Array<{ image_url: string; is_primary: boolean }>) ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs[0] ?? null;
      return {
        id: p.id,
        slug: p.slug,
        common_name: p.common_name,
        scientific_name: p.scientific_name,
        type: p.type,
        water_type: p.water_type,
        difficulty: p.difficulty,
        light_requirement: p.light_requirement,
        primary_image_url: primary?.image_url ?? null,
      };
    });
  } catch {
    // table doesn't exist yet
  }

  const initialTab = tab === "plants" ? "plants" : "fish";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Wiki</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Explore our comprehensive database of aquatic species
        </p>
      </div>

      <WikiFishList
        fish={fish}
        plants={plants}
        labels={labels}
        initialQ={q ?? ""}
        initialLabel={label ?? null}
        initialWaterType={water_type ?? null}
        initialTab={initialTab}
      />

      <RecentlyVisited />
    </div>
  );
}
