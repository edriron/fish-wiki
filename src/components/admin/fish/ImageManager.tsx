"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Star,
  Loader2,
  Image as ImageIcon,
  Pencil,
  Check,
  X,
  Sparkles,
  Search,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadImage,
  deleteImage,
  setImagePrimary,
  updateImageMeta,
  uploadImageFromUrl,
  replaceImageFile,
  moveImageVariant,
} from "@/app/actions/images";
import { generateFishImageUrls, searchImagesByQuery, searchInaturalistImages } from "@/app/actions/ai";
import type { FishImage, FishVariant } from "@/types/fish";

interface ImageManagerProps {
  fishId: string;
  scientificName: string;
  images: FishImage[];
  variants: FishVariant[];
}

interface UploadState {
  caption: string;
  altText: string;
  variantId: string;
  isPrimary: boolean;
}

interface CandidateImage {
  url: string;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
}

// ─── ImageCard ───────────────────────────────────────────────────────────────

function ImageCard({
  image,
  fishId,
  isBaseImage,
  variants,
}: {
  image: FishImage;
  fishId: string;
  isBaseImage: boolean;
  variants: FishVariant[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string>(image.variant_id ?? "");
  const [caption, setCaption] = useState(image.caption ?? "");
  const [altText, setAltText] = useState(image.alt_text ?? "");
  const [frameMode, setFrameMode] = useState<"crop" | "blur">("crop");

  const busy = isPending || isSaving;

  const handleMove = () => {
    const targetId = moveTarget === "" ? null : moveTarget;
    if (targetId === (image.variant_id ?? null)) {
      setMoving(false);
      return;
    }
    startTransition(async () => {
      const result = await moveImageVariant(image.id, fishId, targetId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Image moved.");
        setMoving(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this image?")) return;
    startTransition(async () => {
      await deleteImage(image.id, fishId, image.image_url);
      toast.success("Image deleted.");
      router.refresh();
    });
  };

  const handleSetPrimary = () => {
    startTransition(async () => {
      await setImagePrimary(image.id, fishId);
      toast.success("Primary image set.");
      router.refresh();
    });
  };

  const handleSaveMeta = async () => {
    if (frameMode === "blur") {
      setIsSaving(true);
      try {
        const file = await createBlurFrameImage(image.image_url);
        if (!file) {
          toast.error("Failed to create reframed image.");
          setIsSaving(false);
          return;
        }
        // Save meta first, then replace the image file
        await updateImageMeta(image.id, fishId, caption, altText);
        const formData = new FormData();
        formData.set("image_id", image.id);
        formData.set("fish_id", fishId);
        formData.set("old_url", image.image_url);
        formData.set("file", file);
        const result = await replaceImageFile(formData);
        setIsSaving(false);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Image reframed and saved.");
          setEditing(false);
          setFrameMode("crop");
          router.refresh();
        }
      } catch {
        setIsSaving(false);
        toast.error("Failed to reframe image.");
      }
    } else {
      startTransition(async () => {
        await updateImageMeta(image.id, fishId, caption, altText);
        toast.success("Image updated.");
        setEditing(false);
        router.refresh();
      });
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border overflow-hidden bg-slate-50 dark:bg-slate-700/50",
        image.is_primary
          ? "border-teal-400 ring-2 ring-teal-400/30"
          : "border-slate-200 dark:border-slate-600"
      )}
    >
      {/* Image */}
      <div className="relative aspect-4/3 overflow-hidden">
        {editing && frameMode === "blur" ? (
          <>
            {/* Blurred background — scaled to fill, feathered edges hidden by overflow:hidden */}
            <div
              className="absolute inset-0 scale-110"
              style={{
                backgroundImage: `url(${image.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(14px)",
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
            {/* Foreground — contained */}
            <Image
              src={image.image_url}
              alt={image.alt_text ?? "Fish image"}
              fill
              className="object-contain relative z-10"
              sizes="(max-width: 640px) 50vw, 200px"
            />
          </>
        ) : (
          <Image
            src={image.image_url}
            alt={image.alt_text ?? "Fish image"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        )}
        {image.is_primary && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-xs font-medium text-white shadow">
            <Star className="h-3 w-3 fill-current" />
            Primary
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-2 space-y-1.5">
        {editing ? (
          <div className="space-y-1.5">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (e.g. Male, Female)"
              className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Alt text"
              className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {/* Frame mode toggle */}
            <div className="flex rounded border border-slate-200 dark:border-slate-600 overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => setFrameMode("crop")}
                className={cn(
                  "flex-1 px-2 py-1 transition-colors",
                  frameMode === "crop"
                    ? "bg-slate-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                Crop
              </button>
              <button
                type="button"
                onClick={() => setFrameMode("blur")}
                className={cn(
                  "flex-1 px-2 py-1 border-l border-slate-200 dark:border-slate-600 transition-colors",
                  frameMode === "blur"
                    ? "bg-slate-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                Fit + blur
              </button>
            </div>
            {frameMode === "blur" && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Saving will permanently replace the stored image with the blur-framed version.
              </p>
            )}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSaveMeta}
                disabled={busy}
                className="flex items-center gap-1 rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setFrameMode("crop"); }}
                className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-600 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {image.caption && (
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{image.caption}</p>
            )}
            {!image.caption && !image.alt_text && (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No caption</p>
            )}
          </>
        )}

        {/* Move to variant */}
        {moving && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Move to:</label>
            <select
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Standard (Base)</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleMove}
                disabled={busy}
                className="flex items-center gap-1 rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Move
              </button>
              <button
                type="button"
                onClick={() => { setMoving(false); setMoveTarget(image.variant_id ?? ""); }}
                className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-600 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Edit"
            className="flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {variants.length > 0 && (
            <button
              type="button"
              onClick={() => { setMoving((m) => !m); setMoveTarget(image.variant_id ?? ""); }}
              disabled={busy}
              title="Move to variant"
              className="flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {isBaseImage && !image.is_primary && (
            <button
              type="button"
              onClick={handleSetPrimary}
              disabled={busy}
              title="Set as primary"
              className="flex items-center justify-center rounded border border-teal-200 p-1.5 text-teal-700 hover:bg-teal-50 transition-colors"
            >
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            title="Delete"
            className="ml-auto flex items-center justify-center rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image compression ────────────────────────────────────────────────────────

/** Compresses a raster image client-side to under 900 KB (stays below the 1 MB server-action limit). */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_DIM = 1920;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) { h = Math.round((h * MAX_DIM) / w); w = MAX_DIM; }
        else        { w = Math.round((w * MAX_DIM) / h); h = MAX_DIM; }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);

      const TARGET = 900 * 1024;
      let quality = 0.85;

      const attempt = () => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          if (blob.size > TARGET && quality > 0.2) {
            quality = Math.round((quality - 0.1) * 10) / 10;
            attempt();
          } else {
            resolve(new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"),
              { type: "image/jpeg", lastModified: Date.now() },
            ));
          }
        }, "image/jpeg", quality);
      };
      attempt();
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

// ─── Blur-frame image ────────────────────────────────────────────────────────

/**
 * Renders a 4:3 canvas with a blurred background (fill) + the original image
 * contained on top, then returns it as a JPEG File ready for upload.
 */
async function createBlurFrameImage(imageUrl: string): Promise<File | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const W = 900;
      const H = Math.round(W * (3 / 4)); // 4:3 → 675 px

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Blurred background — scale to fill
      const bgScale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const bgW = img.naturalWidth * bgScale;
      const bgH = img.naturalHeight * bgScale;
      const bgX = (W - bgW) / 2;
      const bgY = (H - bgH) / 2;
      ctx.filter = "blur(18px)";
      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.filter = "none";

      // Darken background slightly so the fish stands out
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, W, H);

      // Foreground — scale to fit (object-contain)
      const fgScale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const fgW = img.naturalWidth * fgScale;
      const fgH = img.naturalHeight * fgScale;
      const fgX = (W - fgW) / 2;
      const fgY = (H - fgH) / 2;
      ctx.drawImage(img, fgX, fgY, fgW, fgH);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(null); return; }
          resolve(new File([blob], `reframed_${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.88,
      );
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

// ─── UploadForm ───────────────────────────────────────────────────────────────

function UploadForm({
  fishId,
  variants,
  onDone,
}: {
  fishId: string;
  variants: FishVariant[];
  onDone: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlValue, setUrlValue] = useState("");
  const [state, setState] = useState<UploadState>({
    caption: "",
    altText: "",
    variantId: "",
    isPrimary: false,
  });
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = () => {
    setError(null);

    if (mode === "url") {
      if (!urlValue.trim()) return;
      startTransition(async () => {
        const result = await uploadImageFromUrl(
          urlValue.trim(), fishId,
          state.caption || null, state.altText || null,
          state.variantId || null, state.isPrimary,
        );
        if (result.error) { setError(result.error); toast.error(result.error); }
        else { toast.success("Image uploaded."); router.refresh(); onDone(); }
      });
      return;
    }

    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setIsCompressing(true);

    compressImage(file).then((compressed) => {
      setIsCompressing(false);
      const formData = new FormData();
      formData.set("file", compressed);
      formData.set("fish_id", fishId);
      formData.set("caption", state.caption);
      formData.set("alt_text", state.altText);
      formData.set("variant_id", state.variantId);
      formData.set("is_primary", state.isPrimary ? "true" : "false");

      startTransition(async () => {
        const result = await uploadImage(formData);
        if (result.error) { setError(result.error); toast.error(result.error); }
        else { toast.success("Image uploaded."); router.refresh(); onDone(); }
      });
    });
  };

  const busy = isCompressing || isPending;

  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-5 space-y-4">
      {/* Header + mode toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upload New Image</h3>
        <div className="flex rounded-md border border-slate-200 dark:border-slate-600 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={cn(
              "px-3 py-1.5 transition-colors",
              mode === "file"
                ? "bg-teal-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "px-3 py-1.5 border-l border-slate-200 dark:border-slate-600 transition-colors",
              mode === "url"
                ? "bg-teal-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            From URL
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* File picker OR URL input */}
        <div className="sm:col-span-2">
          {mode === "file" ? (
            <>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Image file <span className="text-red-500">*</span>
              </label>
              <input
                key="file-input"
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-teal-700 file:cursor-pointer"
              />
              {fileName && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Selected: {fileName} — will be compressed to ≤ 900 KB before upload
                </p>
              )}
            </>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Image URL <span className="text-red-500">*</span>
              </label>
              <input
                key="url-input"
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://upload.wikimedia.org/…"
                className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                The server will download and store the image in Supabase.
              </p>
            </>
          )}
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Caption</label>
          <input
            type="text"
            value={state.caption}
            onChange={(e) => setState((s) => ({ ...s, caption: e.target.value }))}
            placeholder="e.g. Male, Female holding fry"
            className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Alt text */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Alt text</label>
          <input
            type="text"
            value={state.altText}
            onChange={(e) => setState((s) => ({ ...s, altText: e.target.value }))}
            placeholder="Describe the image"
            className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Variant */}
        {variants.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Variant (optional)
            </label>
            <select
              value={state.variantId}
              onChange={(e) => setState((s) => ({ ...s, variantId: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">Base fish (no variant)</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Primary toggle */}
        {!state.variantId && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={state.isPrimary}
              onChange={(e) => setState((s) => ({ ...s, isPrimary: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="is_primary" className="text-xs font-medium text-slate-600">
              Set as primary image
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUpload}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isCompressing ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Compressing…</>
          ) : isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
          ) : (
            <><Upload className="h-4 w-4" />Upload</>
          )}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── CandidateImageCard ───────────────────────────────────────────────────────

function CandidateImageCard({
  candidate,
  onUpload,
}: {
  candidate: CandidateImage;
  onUpload: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden bg-white dark:bg-slate-700/50 transition-opacity",
        candidate.status === "done"
          ? "border-teal-400 opacity-60"
          : "border-slate-200 dark:border-slate-600"
      )}
    >
      <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-700">
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-1">
            <ImageIcon className="h-7 w-7" />
            <span className="text-xs">Can&apos;t load</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.url}
            alt="Candidate fish image"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        )}
        {candidate.status === "done" && (
          <div className="absolute inset-0 bg-teal-600/20 flex items-center justify-center">
            <div className="rounded-full bg-teal-600 p-1.5">
              <Check className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
        {candidate.status === "uploading" && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="p-2">
        {candidate.status === "done" ? (
          <p className="text-xs text-center text-teal-600 dark:text-teal-400 font-medium py-0.5">
            Uploaded
          </p>
        ) : candidate.status === "error" ? (
          <p className="text-xs text-center text-red-600 dark:text-red-400 py-0.5">
            {candidate.errorMsg ?? "Failed"}
          </p>
        ) : (
          <button
            type="button"
            onClick={onUpload}
            disabled={candidate.status === "uploading" || imgError}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-teal-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3 w-3" />
            Upload
          </button>
        )}
      </div>
    </div>
  );
}

// ─── AiFindPanel ─────────────────────────────────────────────────────────────

function AiFindPanel({
  fishId,
  scientificName,
  onClose,
}: {
  fishId: string;
  scientificName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(scientificName);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateImage[]>([]);

  const [source, setSource] = useState<"wikipedia" | "commons" | "inaturalist">("wikipedia");

  const runSearch = async (q: string, src: "wikipedia" | "commons" | "inaturalist") => {
    if (!q.trim()) return;
    setIsLoading(true);
    setFetchError(null);
    setCandidates([]);
    setSource(src);
    const result =
      src === "wikipedia"
        ? await generateFishImageUrls(q.trim())
        : src === "inaturalist"
          ? await searchInaturalistImages(q.trim())
          : await searchImagesByQuery(q.trim());
    setIsLoading(false);
    if ("error" in result && result.error) {
      setFetchError(result.error);
    } else if ("data" in result) {
      setCandidates((result.data ?? []).map((url) => ({ url, status: "pending" as const })));
    }
  };

  // Auto-search by scientific name via Wikipedia on open
  useEffect(() => {
    let cancelled = false;
    runSearch(scientificName, "wikipedia").then(() => {
      if (cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scientificName]);

  const handleUpload = (url: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.url === url ? { ...c, status: "uploading" as const } : c))
    );
    uploadImageFromUrl(url, fishId, null, null, null, false).then((result) => {
      if ("error" in result && result.error) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.url === url ? { ...c, status: "error" as const, errorMsg: result.error } : c
          )
        );
        toast.error(result.error!);
      } else {
        setCandidates((prev) =>
          prev.map((c) => (c.url === url ? { ...c, status: "done" as const } : c))
        );
        toast.success("Image uploaded.");
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Find Images
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-200 dark:border-slate-600 p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && runSearch(query, "commons")}
            placeholder="Species name or keyword…"
            className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Search via:</span>
          {(
            [
              { src: "wikipedia", label: "Wikipedia", title: "Images from the Wikipedia article for this species — curated, best quality" },
              { src: "inaturalist", label: "iNaturalist", title: "Research-grade observation photos from iNaturalist — great for fish species" },
              { src: "commons", label: "Wikimedia Commons", title: "Full-text search across Wikimedia Commons file names and descriptions" },
            ] as const
          ).map(({ src, label, title }) => (
            <button
              key={src}
              type="button"
              onClick={() => runSearch(query, src)}
              disabled={isLoading || !query.trim()}
              title={title}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                source === src && !isLoading
                  ? "border-purple-400 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                  : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
              )}
            >
              {isLoading && source === src ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          <strong className="font-medium">Wikipedia</strong> — images from the species article, best quality.{" "}
          <strong className="font-medium">iNaturalist</strong> — community observation photos, research-grade.{" "}
          <strong className="font-medium">Wikimedia Commons</strong> — broader search; supports operators like{" "}
          <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">Aulonocara male</code>.
        </p>
      </div>

      {/* State: loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Searching for images…</span>
        </div>
      )}

      {/* State: error */}
      {!isLoading && fetchError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {fetchError}
        </p>
      )}

      {/* State: empty */}
      {!isLoading && !fetchError && candidates.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4 italic">
          No images found. Try a different search term.
        </p>
      )}

      {/* Results grid */}
      {!isLoading && candidates.length > 0 && (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Preview and upload the images you want. Verify you have the right to use each image before uploading.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {candidates.map((c) => (
              <CandidateImageCard
                key={c.url}
                candidate={c}
                onUpload={() => handleUpload(c.url)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ImageManager ─────────────────────────────────────────────────────────────

export function ImageManager({ fishId, scientificName, images, variants }: ImageManagerProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showAiFind, setShowAiFind] = useState(false);

  const baseImages = images.filter((img) => img.variant_id === null);
  const variantImages = images.filter((img) => img.variant_id !== null);

  const openUpload = () => { setShowAiFind(false); setShowUpload(true); };
  const openAiFind = () => { setShowUpload(false); setShowAiFind(true); };

  return (
    <div className="space-y-6">
      {/* Base images */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Base Images
            <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
              ({baseImages.length})
            </span>
          </h3>
          {!showUpload && !showAiFind && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAiFind}
                className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Find with AI
              </button>
              <button
                type="button"
                onClick={openUpload}
                className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Image
              </button>
            </div>
          )}
        </div>

        {showUpload && (
          <div className="mb-4">
            <UploadForm
              fishId={fishId}
              variants={variants}
              onDone={() => setShowUpload(false)}
            />
          </div>
        )}

        {showAiFind && (
          <div className="mb-4">
            <AiFindPanel
              fishId={fishId}
              scientificName={scientificName}
              onClose={() => setShowAiFind(false)}
            />
          </div>
        )}

        {baseImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center">
            <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No images yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {baseImages.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                fishId={fishId}
                isBaseImage={true}
                variants={variants}
              />
            ))}
          </div>
        )}
      </div>

      {/* Variant images */}
      {variantImages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Variant Images
            <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
              ({variantImages.length})
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {variantImages.map((img) => {
              const variant = variants.find((v) => v.id === img.variant_id);
              return (
                <div key={img.id} className="space-y-1">
                  {variant && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {variant.name}
                    </p>
                  )}
                  <ImageCard image={img} fishId={fishId} isBaseImage={false} variants={variants} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
