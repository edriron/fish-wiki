import { createPublicClient } from "@/lib/supabase/public";
import { PlantCard } from "@/components/public/PlantCard";
import { Leaf, Shell } from "lucide-react";
import type { PlantCardData } from "@/types/plant";

interface PlantsPageProps {
  searchParams: Promise<{ type?: string; q?: string }>;
}

export const revalidate = 300;

export default async function PlantsPage({ searchParams }: PlantsPageProps) {
  const { type, q } = await searchParams;
  const supabase = createPublicClient();

  const { data: raw } = await supabase
    .from("plant_species")
    .select("id, slug, common_name, scientific_name, type, water_type, difficulty, light_requirement, plant_images(image_url, is_primary)")
    .eq("published", true)
    .order("common_name");

  const all: PlantCardData[] = (raw ?? []).map((p) => {
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

  // Filter client-adaptable: we do it server-side since this is static
  const filtered = all.filter((p) => {
    if (type && p.type !== type) return false;
    if (q) {
      const lq = q.toLowerCase();
      return (
        p.common_name.toLowerCase().includes(lq) ||
        p.scientific_name.toLowerCase().includes(lq)
      );
    }
    return true;
  });

  const plants = filtered.filter((p) => p.type === "plant");
  const corals = filtered.filter((p) => p.type === "coral");

  const showBoth = !type;
  const title = type === "coral" ? "Corals" : type === "plant" ? "Aquatic Plants" : "Plants & Corals";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {filtered.length} species documented
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { label: "All", value: undefined, icon: null },
          { label: "Plants", value: "plant", icon: Leaf },
          { label: "Corals", value: "coral", icon: Shell },
        ].map(({ label, value, icon: Icon }) => {
          const isActive = type === value || (!type && value === undefined);
          const href = value ? `/plants?type=${value}` : "/plants";
          return (
            <a
              key={label}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400"
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </a>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Leaf className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Nothing here yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Check back soon.</p>
        </div>
      ) : showBoth ? (
        <>
          {plants.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                Aquatic Plants
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {plants.map((p) => <PlantCard key={p.id} plant={p} />)}
              </div>
            </section>
          )}
          {corals.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                <Shell className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                Corals
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {corals.map((p) => <PlantCard key={p.id} plant={p} />)}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => <PlantCard key={p.id} plant={p} />)}
        </div>
      )}
    </div>
  );
}
