"use client";

import { useState, useTransition, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadImage,
  deleteImage,
  setImagePrimary,
  updateImageMeta,
} from "@/app/actions/images";
import type { FishImage, FishVariant } from "@/types/fish";

interface ImageManagerProps {
  fishId: string;
  images: FishImage[];
  variants: FishVariant[];
}

interface UploadState {
  caption: string;
  altText: string;
  variantId: string;
  isPrimary: boolean;
}

function ImageCard({
  image,
  fishId,
  isBaseImage,
}: {
  image: FishImage;
  fishId: string;
  isBaseImage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(image.caption ?? "");
  const [altText, setAltText] = useState(image.alt_text ?? "");

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

  const handleSaveMeta = () => {
    startTransition(async () => {
      await updateImageMeta(image.id, fishId, caption, altText);
      toast.success("Image updated.");
      setEditing(false);
      router.refresh();
    });
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
      <div className="relative aspect-4/3">
        <Image
          src={image.image_url}
          alt={image.alt_text ?? "Fish image"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 200px"
        />
        {image.is_primary && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-xs font-medium text-white shadow">
            <Star className="h-3 w-3 fill-current" />
            Primary
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSaveMeta}
                disabled={isPending}
                className="flex items-center gap-1 rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700"
              >
                <Check className="h-3 w-3" />
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
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

        {/* Actions */}
        <div className="flex items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-600 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          {isBaseImage && !image.is_primary && (
            <button
              type="button"
              onClick={handleSetPrimary}
              disabled={isPending}
              className="flex items-center gap-1 rounded border border-teal-200 px-2 py-1 text-xs text-teal-700 hover:bg-teal-50 transition-colors"
            >
              <Star className="h-3 w-3" />
              Primary
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="ml-auto flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [state, setState] = useState<UploadState>({
    caption: "",
    altText: "",
    variantId: "",
    isPrimary: false,
  });
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("fish_id", fishId);
    formData.set("caption", state.caption);
    formData.set("alt_text", state.altText);
    formData.set("variant_id", state.variantId);
    formData.set("is_primary", state.isPrimary ? "true" : "false");

    startTransition(async () => {
      const result = await uploadImage(formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Image uploaded.");
        router.refresh();
        onDone();
      }
    });
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upload New Image</h3>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* File picker */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Image file <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-teal-700 file:cursor-pointer"
            />
          </div>
          {fileName && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Selected: {fileName}</p>
          )}
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Caption
          </label>
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
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Alt text
          </label>
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
              onChange={(e) =>
                setState((s) => ({ ...s, variantId: e.target.value }))
              }
              className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">Base fish (no variant)</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
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
              onChange={(e) =>
                setState((s) => ({ ...s, isPrimary: e.target.checked }))
              }
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
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload
            </>
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

export function ImageManager({ fishId, images, variants }: ImageManagerProps) {
  const [showUpload, setShowUpload] = useState(false);

  const baseImages = images.filter((img) => img.variant_id === null);
  const variantImages = images.filter((img) => img.variant_id !== null);

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
          {!showUpload && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Image
            </button>
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Variant images */}
      {variantImages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
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
                    <p className="text-xs font-medium text-slate-500">
                      {variant.name}
                    </p>
                  )}
                  <ImageCard image={img} fishId={fishId} isBaseImage={false} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
