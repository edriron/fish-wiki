"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Fish, X, LayoutGrid, LayoutList } from "lucide-react";
import type { FishImage, FishVariant } from "@/types/fish";

function GalleryImageItem({
  img,
  fishName,
  onClick,
}: {
  img: FishImage;
  fishName: string;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="group">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
        aria-label={`Expand ${img.caption ?? img.alt_text ?? fishName}`}
      >
        <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 cursor-pointer">
          {/* Placeholder shown until image loads */}
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse">
              <Fish className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <span className="mt-1.5 text-xs text-slate-300 dark:text-slate-600">Loading…</span>
            </div>
          )}
          <Image
            src={img.image_url}
            alt={img.alt_text ?? fishName}
            fill
            className={cn(
              "object-cover transition-all duration-300 group-hover:scale-105",
              loaded ? "opacity-100" : "opacity-0",
            )}
            sizes="(max-width: 640px) 50vw, 33vw"
            onLoad={() => setLoaded(true)}
          />
          {img.caption && loaded && (
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2">
              <p className="text-xs font-medium text-white">{img.caption}</p>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

interface VariantGalleryProps {
  images: FishImage[];      // all non-hero images (primary excluded)
  variants: FishVariant[];
  fishName: string;
}

type ViewMode = "cards" | "sections";
const GALLERY_VIEW_KEY = "fish-gallery-view";

export function VariantGallery({ images, variants, fishName }: VariantGalleryProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<FishImage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Hydrate view preference from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem(GALLERY_VIEW_KEY) as ViewMode | null;
    if (saved === "cards" || saved === "sections") setViewMode(saved);
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(GALLERY_VIEW_KEY, mode);
  };

  const hasVariants = variants.length > 0;

  // "Standard" = images with no variant_id
  const baseImages = images.filter((img) => img.variant_id === null);

  // Current tab images (cards view)
  const visibleImages = selectedVariant
    ? images.filter((img) => img.variant_id === selectedVariant)
    : baseImages;

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxImg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImg(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxImg]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImg) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxImg]);

  // Only render if there are any images at all
  const totalImages = images.length;
  if (totalImages === 0) return null;

  const lightboxVariantName = lightboxImg?.variant_id
    ? variants.find((v) => v.id === lightboxImg.variant_id)?.name ?? null
    : null;

  const viewToggle = (
    <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
      <button
        type="button"
        onClick={() => handleViewChange("cards")}
        title="Cards view"
        className={cn(
          "rounded-md p-1.5 transition-colors",
          viewMode === "cards"
            ? "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleViewChange("sections")}
        title="Sections view"
        className={cn(
          "rounded-md p-1.5 transition-colors",
          viewMode === "sections"
            ? "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        )}
      >
        <LayoutList className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Gallery</h2>
          {viewToggle}
        </div>
        <Separator className="mb-4" />

        {viewMode === "sections" ? (
          /* Sections view — all variants shown at once */
          <div className="space-y-6">
            {hasVariants ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                    Standard
                  </h3>
                  {baseImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {baseImages.map((img) => (
                        <GalleryImageItem key={img.id} img={img} fishName={fishName} onClick={() => setLightboxImg(img)} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">No standard images.</p>
                  )}
                </div>
                {variants.map((v) => {
                  const variantImages = images.filter((img) => img.variant_id === v.id);
                  return (
                    <div key={v.id}>
                      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                        {v.name}
                      </h3>
                      {variantImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {variantImages.map((img) => (
                            <GalleryImageItem key={img.id} img={img} fishName={fishName} onClick={() => setLightboxImg(img)} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No images for this variant.</p>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <GalleryImageItem key={img.id} img={img} fishName={fishName} onClick={() => setLightboxImg(img)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Cards view (original) */
          <>
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
                    onClick={() => setSelectedVariant(selectedVariant === v.id ? null : v.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                      selectedVariant === v.id
                        ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400"
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
            {visibleImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleImages.map((img) => (
                  <GalleryImageItem key={img.id} img={img} fishName={fishName} onClick={() => setLightboxImg(img)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <Fish className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No images for this variant yet.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image container — stop click propagation so clicking image doesn't close */}
          <div
            className="relative flex max-h-[90svh] max-w-[92vw] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImg.image_url}
              alt={lightboxImg.alt_text ?? fishName}
              className="max-h-[82svh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            />

            {/* Overlay text: variant name + caption */}
            {(lightboxVariantName || lightboxImg.caption) && (
              <div className="mt-3 flex flex-col items-center gap-0.5 text-center">
                {lightboxVariantName && (
                  <p className="text-sm font-semibold text-white">{lightboxVariantName}</p>
                )}
                {lightboxImg.caption && (
                  <p className="text-sm text-slate-300">{lightboxImg.caption}</p>
                )}
              </div>
            )}
          </div>

          {/* Tap outside hint for mobile */}
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/40 select-none">
            Tap outside or press Esc to close
          </p>
        </div>
      )}
    </>
  );
}
