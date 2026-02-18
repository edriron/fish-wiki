"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Upload,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createVariant, updateVariant, deleteVariant } from "@/app/actions/variants";
import { uploadImage } from "@/app/actions/images";
import type { FishVariant, FishImage } from "@/types/fish";
import Image from "next/image";

interface VariantManagerProps {
  fishId: string;
  variants: FishVariant[];
  images: FishImage[];
}

function VariantRow({
  variant,
  fishId,
  images,
}: {
  variant: FishVariant;
  fishId: string;
  images: FishImage[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(variant.name);
  const [description, setDescription] = useState(variant.description ?? "");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const variantImages = images.filter((img) => img.variant_id === variant.id);

  const handleSave = () => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    startTransition(async () => {
      await updateVariant(variant.id, fishId, formData);
      setEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete variant "${variant.name}" and all its images?`)) return;
    startTransition(async () => {
      await deleteVariant(variant.id, fishId);
      router.refresh();
    });
  };

  const handleUploadVariantImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("fish_id", fishId);
    formData.set("variant_id", variant.id);
    formData.set("is_primary", "false");

    await uploadImage(formData);
    setUploading(false);
    router.refresh();
    e.target.value = "";
  };

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Variant name"
              className="h-8 flex-1 rounded border border-slate-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 text-xs text-white hover:bg-teal-700"
            >
              <Check className="h-3 w-3" />
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(variant.name);
              }}
              className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-medium text-slate-800">
              {variant.name}
            </span>
            <span className="text-xs text-slate-400">
              {variantImages.length} image{variantImages.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {!editing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isPending && <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Description field */}
          {editing && (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Variant description (optional)"
              rows={2}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          )}
          {!editing && variant.description && (
            <p className="text-sm text-slate-500">{variant.description}</p>
          )}

          {/* Images grid */}
          {variantImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {variantImages.map((img) => (
                <div
                  key={img.id}
                  className="relative rounded-md border border-slate-200 overflow-hidden aspect-4/3"
                >
                  <Image
                    src={img.image_url}
                    alt={img.alt_text ?? variant.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 text-xs text-white truncate">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          <div className="flex items-center gap-2">
            <label
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors",
                uploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Add Image
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={handleUploadVariantImage}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function AddVariantForm({
  fishId,
  nextOrder,
  onDone,
}: {
  fishId: string;
  nextOrder: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.set("fish_id", fishId);
    formData.set("name", name);
    formData.set("description", description);
    formData.set("order_index", String(nextOrder));

    startTransition(async () => {
      const result = await createVariant(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        onDone();
      }
    });
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-700">Add Variant</h4>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Variant name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Black Acei, Albino"
            autoFocus
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description (optional)"
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !name.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Variant
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function VariantManager({ fishId, variants, images }: VariantManagerProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-3">
      {variants.length === 0 && !showAdd && (
        <p className="text-sm text-slate-400 italic">
          No variants yet. Add color or pattern variants of this species.
        </p>
      )}

      {variants.map((variant) => (
        <VariantRow
          key={variant.id}
          variant={variant}
          fishId={fishId}
          images={images}
        />
      ))}

      {showAdd ? (
        <AddVariantForm
          fishId={fishId}
          nextOrder={variants.length}
          onDone={() => setShowAdd(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </button>
      )}
    </div>
  );
}
