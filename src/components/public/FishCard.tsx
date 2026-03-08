import Image from "next/image";
import Link from "next/link";
import { Fish } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FishCardData, FishLabel } from "@/types/fish";
import { LabelIcon } from "@/components/public/LabelIcon";

const SHOW_LABEL_ICON = false;

const waterTypeStyles: Record<string, string> = {
  freshwater:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  saltwater:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900",
  brackish:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900",
};

const difficultyStyles: Record<string, string> = {
  beginner:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900",
  intermediate:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  expert:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
};

function getLabelDepth(labelId: string, allLabels: FishLabel[]): number {
  const label = allLabels.find((l) => l.id === labelId);
  if (!label?.parent_id) return 0;
  return 1 + getLabelDepth(label.parent_id, allLabels);
}

function getDeepestLabel(
  fishLabels: FishLabel[],
  allLabels: FishLabel[],
): FishLabel | null {
  if (!fishLabels.length || !allLabels.length) return null;
  return fishLabels.reduce((best, current) =>
    getLabelDepth(current.id, allLabels) > getLabelDepth(best.id, allLabels)
      ? current
      : best,
  );
}

interface FishCardProps {
  fish: FishCardData;
  allLabels?: FishLabel[];
}

export function FishCard({ fish, allLabels = [] }: FishCardProps) {
  const deepestLabel = getDeepestLabel(fish.labels, allLabels);
  const waterKey = fish.water_type?.toLowerCase() ?? "";
  const diffKey = fish.difficulty_level?.toLowerCase() ?? "";

  return (
    <Link href={`/wiki/${fish.slug}`} className="group block">
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-teal-200 h-full py-0 gap-0">
        <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
          {fish.primary_image ? (
            <Image
              src={fish.primary_image}
              alt={fish.primary_image_alt ?? fish.common_name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
              <Fish className="h-12 w-12" />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                No image
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors dark:text-slate-100 dark:group-hover:text-teal-400">
                {fish.common_name}
              </h3>
              <p className="mt-0.5 text-sm italic text-slate-500 truncate dark:text-slate-400">
                {fish.scientific_name}
              </p>
            </div>
            {SHOW_LABEL_ICON && deepestLabel && (
              <LabelIcon
                name={deepestLabel.name}
                color={deepestLabel.color}
                size={42}
              />
            )}
          </div>

          {(fish.water_type || fish.difficulty_level) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {fish.water_type && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize font-normal",
                    waterTypeStyles[waterKey],
                  )}
                >
                  {fish.water_type}
                </Badge>
              )}
              {fish.difficulty_level && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize font-normal",
                    difficultyStyles[diffKey],
                  )}
                >
                  {fish.difficulty_level}
                </Badge>
              )}
            </div>
          )}

          {fish.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {fish.labels.slice(0, 3).map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  style={
                    label.color
                      ? {
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                        }
                      : undefined
                  }
                >
                  {label.name}
                </span>
              ))}
              {fish.labels.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  +{fish.labels.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
