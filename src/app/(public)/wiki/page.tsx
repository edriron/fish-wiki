import { Suspense } from "react";
import { Fish } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { FishCard } from "@/components/public/FishCard";
import { SearchBar } from "@/components/public/SearchBar";
import { LabelFilter } from "@/components/public/LabelFilter";
import { RecentlyVisited } from "@/components/public/RecentlyVisited";
import { Skeleton } from "@/components/ui/skeleton";
import type { FishCardData, FishLabel } from "@/types/fish";

interface WikiPageProps {
  searchParams: Promise<{ q?: string; label?: string; water_type?: string }>;
}

async function FishGrid({ searchParams }: WikiPageProps) {
  const { q, label, water_type } = await searchParams;
  const supabase = createPublicClient();

  let query = supabase
    .from("fish_species")
    .select(
      `
      id, slug, common_name, scientific_name, water_type, difficulty_level,
      fish_images(image_url, alt_text, is_primary),
      fish_labels(labels(id, name, color))
    `,
    )
    .eq("published", true)
    .order("common_name");

  if (q?.trim()) {
    query = query.or(
      `common_name.ilike.%${q.trim()}%,scientific_name.ilike.%${q.trim()}%`,
    );
  }

  if (water_type) {
    query = query.ilike("water_type", water_type);
  }

  const { data: fishData } = await query;

  // Transform raw Supabase rows into FishCardData shape
  let fish: FishCardData[] = (fishData ?? []).map((f) => {
    const images =
      (f.fish_images as Array<{
        image_url: string;
        alt_text: string | null;
        is_primary: boolean;
      }>) ?? [];
    const primaryImage =
      images.find((img) => img.is_primary) ?? images[0] ?? null;

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

  // Filter by label client-side after fetch
  if (label) {
    fish = fish.filter((f) => f.labels.some((l) => l.id === label));
  }

  if (fish.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Fish className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          No fish found
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {q
            ? `No results for "${q}". Try a different search term.`
            : "No species match the current filters."}
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {fish.length}
        </span>{" "}
        {fish.length === 1 ? "species" : "species"} found
        {q ? (
          <>
            {" "}
            for{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              &ldquo;{q}&rdquo;
            </span>
          </>
        ) : null}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {fish.map((f) => (
          <FishCard key={f.id} fish={f} />
        ))}
      </div>
    </>
  );
}

function FishGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700"
        >
          <Skeleton className="aspect-4/3 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-1.5 mt-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function LabelsSection() {
  const supabase = createPublicClient();
  const { data: labels } = await supabase
    .from("labels")
    .select("id, name, color")
    .order("name");

  if (!labels || labels.length === 0) return null;

  return (
    <div className="mb-6">
      <Suspense fallback={null}>
        <LabelFilter labels={labels} />
      </Suspense>
    </div>
  );
}

export default async function WikiPage({ searchParams }: WikiPageProps) {
  const { water_type } = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Fish Species
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {water_type
            ? `Showing ${water_type} fish`
            : "Explore our comprehensive database of aquatic species"}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      {/* Label Filter */}
      <LabelsSection />

      {/* Grid */}
      <Suspense fallback={<FishGridSkeleton />}>
        <FishGrid searchParams={searchParams} />
      </Suspense>

      {/* Recently Visited */}
      <RecentlyVisited />
    </div>
  );
}
