"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Fish } from "lucide-react";
import type { FishImage, FishVariant } from "@/types/fish";

interface VariantGalleryProps {
  images: FishImage[];      // all non-hero images (primary excluded)
  variants: FishVariant[];
  fishName: string;
}

export function VariantGallery({ images, variants, fishName }: VariantGalleryProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const hasVariants = variants.length > 0;

  // "Standard" = images with no variant_id
  const baseImages = images.filter((img) => img.variant_id === null);

  // Current tab images
  const visibleImages = selectedVariant
    ? images.filter((img) => img.variant_id === selectedVariant)
    : baseImages;

  // Only render if there are any images at all
  const totalImages = images.length;
  if (totalImages === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Gallery</h2>
      <Separator className="mb-4" />

      {/* Variant tabs — only shown when variants exist */}
      {hasVariants && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedVariant(null)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
              selectedVariant === null
                ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400"
            )}
          >
            Standard
          </button>

          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() =>
                setSelectedVariant(selectedVariant === v.id ? null : v.id)
              }
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                selectedVariant === v.id
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* Image grid */}
      {visibleImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleImages.map((img) => (
            <div key={img.id} className="group">
              <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                <Image
                  src={img.image_url}
                  alt={img.alt_text ?? fishName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2">
                    <p className="text-xs font-medium text-white">{img.caption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state for a variant that has no images yet */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Fish className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No images for this variant yet.
          </p>
        </div>
      )}
    </section>
  );
}
