"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Shell, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlantCardData } from "@/types/plant";

const difficultyStyles: Record<string, string> = {
  easy: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900",
  intermediate: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  expert: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
};

const lightDots: Record<string, string> = {
  low: "●○○",
  medium: "●●○",
  high: "●●●",
};

export function PlantCard({ plant }: { plant: PlantCardData }) {
  const [imgError, setImgError] = useState(false);
  const diffKey = plant.difficulty?.toLowerCase() ?? "";
  const lightKey = plant.light_requirement?.toLowerCase() ?? "";
  const isCoral = plant.type === "coral";
  const showImage = !!plant.primary_image_url && !imgError;

  return (
    <Link href={`/plants/${plant.slug}`} className="group block">
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-teal-200 h-full py-0 gap-0">
        <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          {showImage ? (
            <Image
              src={plant.primary_image_url!}
              alt={plant.common_name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
              {isCoral ? <Shell className="h-12 w-12" /> : <Leaf className="h-12 w-12" />}
              <span className="text-xs text-slate-400 dark:text-slate-500">No image</span>
            </div>
          )}
          {/* Type badge */}
          <div className="absolute top-2 right-2">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              isCoral
                ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
                : "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
            )}>
              {isCoral ? <Shell className="h-3 w-3" /> : <Leaf className="h-3 w-3" />}
              {isCoral ? "Coral" : "Plant"}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors dark:text-slate-100 dark:group-hover:text-teal-400">
            {plant.common_name}
          </h3>
          <p className="mt-0.5 text-sm italic text-slate-500 truncate dark:text-slate-400">
            {plant.scientific_name}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {lightDots[lightKey] && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Sun className="h-3 w-3" />
                {lightDots[lightKey]}
              </span>
            )}
            {plant.difficulty && (
              <Badge
                variant="outline"
                className={cn("text-xs capitalize font-normal", difficultyStyles[diffKey])}
              >
                {plant.difficulty}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
