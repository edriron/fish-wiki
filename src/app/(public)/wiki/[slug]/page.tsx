import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Fish, Droplets, MapPin, Gauge, Globe, ArrowLeft, Utensils } from "lucide-react";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { WaterParametersCard } from "@/components/public/WaterParametersCard";
import { VariantGallery } from "@/components/public/VariantGallery";
import type { FishImage, FishLabel, FishVariant } from "@/types/fish";

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("fish_species")
    .select("slug")
    .eq("published", true);
  return data?.map((f) => ({ slug: f.slug })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data: fish } = await supabase
    .from("fish_species")
    .select("common_name, scientific_name, description")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!fish) return {};

  return {
    title: `${fish.common_name} (${fish.scientific_name}) | Fish Wiki`,
    description:
      fish.description?.slice(0, 160) ??
      `Learn about ${fish.common_name}, scientifically known as ${fish.scientific_name}.`,
  };
}

const difficultyConfig: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  beginner: {
    label: "Beginner",
    color: "text-green-700 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  easy: {
    label: "Easy",
    color: "text-green-700 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  intermediate: {
    label: "Intermediate",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  expert: {
    label: "Expert",
    color: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

const waterTypeConfig: Record<string, { label: string; color: string }> = {
  freshwater: { label: "Freshwater", color: "text-blue-700 bg-blue-50 border-blue-200" },
  saltwater: { label: "Saltwater", color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  brackish: { label: "Brackish", color: "text-purple-700 bg-purple-50 border-purple-200" },
};

const dietConfig: Record<string, { label: string; color: string; dot: string }> = {
  carnivore: {
    label: "Carnivore",
    color: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  omnivore: {
    label: "Omnivore",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  herbivore: {
    label: "Herbivore",
    color: "text-green-700 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  "algae eater": {
    label: "Algae Eater",
    color: "text-teal-700 bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
  },
};

export default async function FishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: fish } = await supabase
    .from("fish_species")
    .select(
      `
      *,
      fish_images(id, image_url, alt_text, caption, variant_id, is_primary, order_index),
      fish_labels(labels(id, name, color))
    `
    )
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!fish) notFound();

  // Sort images: primary first, then by order_index
  const images: FishImage[] = (
    (fish.fish_images as FishImage[]) ?? []
  ).sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });

  const primaryImage = images[0] ?? null;
  const galleryImages = images.slice(1);

  const rawLabels = fish.fish_labels as unknown as Array<{
    labels: FishLabel | FishLabel[] | null;
  }>;
  const labels: FishLabel[] =
    rawLabels?.flatMap((fl) => {
      const l = fl.labels;
      if (!l) return [];
      return Array.isArray(l) ? l : [l];
    }) ?? [];

  // Fetch water profile (safe to fail — table may not exist in all envs)
  let waterProfileName: string | null = null;
  let waterProfile: {
    temp_min: number | null; temp_max: number | null;
    ph_min: number | null;   ph_max: number | null;
    gh_min: number | null;   gh_max: number | null;
    kh_min: number | null;   kh_max: number | null;
  } | null = null;

  if (fish.water_profile_id) {
    const { data: profile } = await supabase
      .from("water_profiles")
      .select("name, temp_min, temp_max, ph_min, ph_max, gh_min, gh_max, kh_min, kh_max")
      .eq("id", fish.water_profile_id)
      .single();
    if (profile) {
      waterProfileName = profile.name;
      waterProfile = profile;
    }
  }

  // Fetch variants (safe to fail — table may not exist in all envs)
  let variants: FishVariant[] = [];
  const { data: variantData } = await supabase
    .from("fish_variants")
    .select("id, fish_id, name, description, order_index")
    .eq("fish_id", fish.id)
    .order("order_index");
  if (variantData) variants = variantData;

  const waterKey = fish.water_type?.toLowerCase() ?? "";
  const diffKey = fish.difficulty_level?.toLowerCase() ?? "";
  const dietKey = fish.diet?.toLowerCase() ?? "";
  const waterCfg = waterTypeConfig[waterKey];
  const diffCfg = difficultyConfig[diffKey];
  const dietCfg = dietConfig[dietKey];

  return (
    <div>
      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-90 max-h-140 w-full bg-slate-900 overflow-hidden">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.image_url}
              alt={primaryImage.alt_text ?? fish.common_name}
              fill
              className="object-cover opacity-80"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Fish className="h-24 w-24 text-slate-700" />
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-medium tracking-widest text-teal-400 uppercase mb-1">
              Fish Species
            </p>
            <h1 className="text-4xl font-extrabold text-white leading-tight sm:text-5xl">
              {fish.common_name}
            </h1>
            <p className="mt-1.5 text-lg italic text-slate-300">
              {fish.scientific_name}
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb + Back */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/wiki">Wiki</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{fish.common_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Link
            href="/wiki"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Wiki
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left column: Labels + About + Gallery */}
          <div className="lg:col-span-2 space-y-10">
            {/* Clickable label filters */}
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <Link
                    key={label.id}
                    href={`/wiki?label=${label.id}`}
                    className="group"
                  >
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-sm cursor-pointer transition-opacity group-hover:opacity-75"
                      style={
                        label.color
                          ? {
                              backgroundColor: `${label.color}20`,
                              color: label.color,
                              border: `1px solid ${label.color}40`,
                            }
                          : undefined
                      }
                    >
                      {label.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            {fish.description && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  About
                </h2>
                <Separator className="mb-4" />
                <p className="text-slate-600 leading-relaxed text-base">
                  {fish.description}
                </p>
              </section>
            )}

            {/* Gallery */}
            <VariantGallery
              images={galleryImages}
              variants={variants}
              fishName={fish.common_name}
            />

            {/* Empty state */}
            {!fish.description && galleryImages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <Fish className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500">
                  Detailed information coming soon.
                </p>
              </div>
            )}
          </div>

          {/* Right column: Classification + Water Parameters */}
          <div className="space-y-6">
            {/* Classification Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Scientific name */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Globe className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Scientific Name
                    </p>
                    <p className="mt-0.5 italic font-medium text-slate-800">
                      {fish.scientific_name}
                    </p>
                  </div>
                </div>

                {fish.origin_region && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <MapPin className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Origin Region
                        </p>
                        <p className="mt-0.5 font-medium text-slate-800">
                          {fish.origin_region}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {fish.water_type && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Droplets className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Water Type
                        </p>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className={`capitalize font-normal ${waterCfg?.color ?? ""}`}
                          >
                            {fish.water_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {fish.diet && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Utensils className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Diet
                        </p>
                        <div className="mt-1">
                          {dietCfg ? (
                            <Badge
                              variant="outline"
                              className={`font-normal ${dietCfg.color}`}
                            >
                              <span
                                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${dietCfg.dot}`}
                              />
                              {dietCfg.label}
                            </Badge>
                          ) : (
                            <p className="font-medium text-slate-800 capitalize">
                              {fish.diet}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {fish.difficulty_level && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Gauge className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Care Difficulty
                        </p>
                        <div className="mt-1">
                          {diffCfg ? (
                            <Badge
                              variant="outline"
                              className={`capitalize font-normal ${diffCfg.color}`}
                            >
                              <span
                                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${diffCfg.dot}`}
                              />
                              {diffCfg.label}
                            </Badge>
                          ) : (
                            <p className="capitalize font-medium text-slate-800">
                              {fish.difficulty_level}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Water Parameters Card — params sourced from the linked profile */}
            <WaterParametersCard
              temp_min={waterProfile?.temp_min}
              temp_max={waterProfile?.temp_max}
              ph_min={waterProfile?.ph_min}
              ph_max={waterProfile?.ph_max}
              gh_min={waterProfile?.gh_min}
              gh_max={waterProfile?.gh_max}
              kh_min={waterProfile?.kh_min}
              kh_max={waterProfile?.kh_max}
              min_tank_liters={fish.min_tank_liters}
              profile_name={waterProfileName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
