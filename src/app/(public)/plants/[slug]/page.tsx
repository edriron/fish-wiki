import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Leaf, Shell, Sun, Thermometer, ArrowLeft, Globe, MapPin, Gauge, Droplets, Wind } from "lucide-react";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("plant_species").select("slug").eq("published", true);
  return data?.map((p) => ({ slug: p.slug })) ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data: plant } = await supabase
    .from("plant_species").select("common_name, scientific_name, description")
    .eq("slug", slug).eq("published", true).single();
  if (!plant) return {};
  return {
    title: `${plant.common_name} (${plant.scientific_name}) | Fish Wiki`,
    description: plant.description?.slice(0, 160) ?? `Learn about ${plant.common_name}.`,
  };
}

const difficultyConfig: Record<string, { label: string; color: string; dot: string }> = {
  easy:         { label: "Easy",         color: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/40 dark:border-green-900", dot: "bg-green-500" },
  intermediate: { label: "Intermediate", color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900", dot: "bg-amber-500" },
  expert:       { label: "Expert",       color: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900",             dot: "bg-red-500" },
};

const lightColors: Record<string, string> = {
  low:    "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/40 dark:border-yellow-900",
  medium: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900",
  high:   "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-900",
};

const lightDots: Record<string, string> = { low: "●○○", medium: "●●○", high: "●●●" };

const growthColors: Record<string, string> = {
  slow:   "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400",
  medium: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-900",
  fast:   "text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/40 dark:border-teal-900",
};

export default async function PlantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: plant } = await supabase
    .from("plant_species").select("*")
    .eq("slug", slug).eq("published", true).single();

  if (!plant) notFound();

  const { data: imagesRaw } = await supabase
    .from("plant_images")
    .select("id, image_url, alt_text, caption, is_primary, order_index")
    .eq("plant_id", plant.id)
    .order("order_index")
    .order("is_primary", { ascending: false });

  const images = (imagesRaw ?? []) as Array<{
    id: string; image_url: string; alt_text: string | null;
    caption: string | null; is_primary: boolean; order_index: number;
  }>;
  const heroImage = images.find((i) => i.is_primary) ?? images[0] ?? null;
  const heroUrl = heroImage?.image_url ?? plant.primary_image_url ?? null;

  const isCoral = plant.type === "coral";
  const diffCfg = difficultyConfig[plant.difficulty?.toLowerCase() ?? ""];
  const lightKey = plant.light_requirement?.toLowerCase() ?? "";
  const growthKey = plant.growth_rate?.toLowerCase() ?? "";

  const Icon = isCoral ? Shell : Leaf;

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[40vh] min-h-72 max-h-120 w-full bg-slate-900 overflow-hidden">
        {heroUrl ? (
          <>
            <Image src={heroUrl} alt={plant.common_name} fill className="object-cover opacity-80" priority sizes="100vw" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon className="h-24 w-24 text-slate-700" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-medium tracking-widest text-teal-400 uppercase mb-1">
              {isCoral ? "Coral" : "Aquatic Plant"}
            </p>
            <h1 className="text-4xl font-extrabold text-white leading-tight sm:text-5xl">
              {plant.common_name}
            </h1>
            <p className="mt-1.5 text-lg italic text-slate-300">{plant.scientific_name}</p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/plants">Plants &amp; Corals</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{plant.common_name}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Link href="/plants" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 transition-colors dark:text-slate-400 dark:hover:text-teal-400">
            <ArrowLeft className="h-3.5 w-3.5" />Back
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2 space-y-10">
            {plant.description && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">About</h2>
                <Separator className="mb-4" />
                <p className="text-slate-600 leading-relaxed text-base dark:text-slate-300">{plant.description}</p>
              </section>
            )}
            {!plant.description && (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <Icon className="h-12 w-12 text-slate-300 mb-3 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">Detailed information coming soon.</p>
              </div>
            )}

            {images.length > 1 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Photos</h2>
                <Separator className="mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="space-y-1">
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={img.image_url}
                          alt={img.alt_text ?? plant.common_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      </div>
                      {img.caption && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{img.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right */}
          <div>
            <Card className="border-slate-200 shadow-sm dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Scientific name */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                    <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Scientific Name</p>
                    <p className="mt-0.5 italic font-medium text-slate-800 dark:text-slate-200">{plant.scientific_name}</p>
                  </div>
                </div>

                {plant.origin_region && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Origin</p>
                      <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{plant.origin_region}</p>
                    </div>
                  </div>
                </>)}

                {plant.water_type && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Droplets className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Water Type</p>
                      <p className="mt-0.5 capitalize font-medium text-slate-800 dark:text-slate-200">{plant.water_type}</p>
                    </div>
                  </div>
                </>)}

                {plant.light_requirement && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Sun className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Light</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className={`capitalize font-normal ${lightColors[lightKey] ?? ""}`}>
                          {lightDots[lightKey]} {plant.light_requirement}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>)}

                {plant.co2_requirement && !isCoral && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Wind className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">CO₂</p>
                      <p className="mt-0.5 capitalize font-medium text-slate-800 dark:text-slate-200">{plant.co2_requirement}</p>
                    </div>
                  </div>
                </>)}

                {plant.difficulty && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Gauge className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Difficulty</p>
                      <div className="mt-1">
                        {diffCfg ? (
                          <Badge variant="outline" className={`capitalize font-normal ${diffCfg.color}`}>
                            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${diffCfg.dot}`} />
                            {diffCfg.label}
                          </Badge>
                        ) : (
                          <p className="capitalize font-medium text-slate-800 dark:text-slate-200">{plant.difficulty}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>)}

                {plant.growth_rate && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Leaf className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Growth Rate</p>
                      <div className="mt-1">
                        <Badge variant="outline" className={`capitalize font-normal ${growthColors[growthKey] ?? ""}`}>
                          {plant.growth_rate}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>)}

                {plant.substrate !== null && !isCoral && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Leaf className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Substrate</p>
                      <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                        {plant.substrate ? "Requires substrate" : "Floats / attaches"}
                      </p>
                    </div>
                  </div>
                </>)}

                {(plant.temp_min || plant.temp_max) && (<>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Thermometer className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Temperature</p>
                      <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                        {plant.temp_min && plant.temp_max
                          ? `${plant.temp_min}–${plant.temp_max} °C`
                          : plant.temp_min ? `≥ ${plant.temp_min} °C` : `≤ ${plant.temp_max} °C`}
                      </p>
                    </div>
                  </div>
                </>)}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
