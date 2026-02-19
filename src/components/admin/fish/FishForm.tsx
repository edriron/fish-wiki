"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toSlug } from "@/lib/slug";
import { AiButton } from "@/components/admin/AiButton";
import { createFish, updateFish } from "@/app/actions/fish";
import type { FishSpecies, WaterProfile } from "@/types/fish";
import { generateFishData } from "@/app/actions/ai";

interface Label {
  id: string;
  name: string;
  color: string | null;
}

interface FishFormProps {
  fish?: FishSpecies;
  waterProfiles: WaterProfile[];
  allLabels: Label[];
  selectedLabelIds?: string[];
}

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
const TEXTAREA =
  "w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none";
const SELECT = cn(FIELD, "cursor-pointer");

export function FishForm({
  fish,
  waterProfiles,
  allLabels,
  selectedLabelIds = [],
}: FishFormProps) {
  const isEdit = Boolean(fish);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Controlled fields
  const [commonName, setCommonName] = useState(fish?.common_name ?? "");
  const [slug, setSlug] = useState(fish?.slug ?? "");
  const [scientificName, setScientificName] = useState(
    fish?.scientific_name ?? "",
  );
  const [description, setDescription] = useState(fish?.description ?? "");
  const [originRegion, setOriginRegion] = useState(fish?.origin_region ?? "");
  const [waterType, setWaterType] = useState(fish?.water_type ?? "");
  const [difficultyLevel, setDifficultyLevel] = useState(
    fish?.difficulty_level ?? "",
  );
  const [diet, setDiet] = useState(fish?.diet ?? "");
  const [waterProfileId, setWaterProfileId] = useState(
    fish?.water_profile_id ?? "",
  );
  const [minTankLiters, setMinTankLiters] = useState(
    fish?.min_tank_liters?.toString() ?? "",
  );
  const [published, setPublished] = useState(fish?.published ?? false);
  const [selectedLabels, setSelectedLabels] =
    useState<string[]>(selectedLabelIds);

  const handleCommonNameChange = (value: string) => {
    setCommonName(value);
    if (!isEdit) {
      setSlug(toSlug(value));
    }
  };

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("common_name", commonName);
    formData.set("slug", slug);
    formData.set("scientific_name", scientificName);
    formData.set("description", description);
    formData.set("origin_region", originRegion);
    formData.set("water_type", waterType);
    formData.set("difficulty_level", difficultyLevel);
    formData.set("diet", diet);
    formData.set("water_profile_id", waterProfileId);
    formData.set("min_tank_liters", minTankLiters);
    formData.set("published", published ? "true" : "false");
    selectedLabels.forEach((id) => formData.append("label_ids", id));

    startTransition(async () => {
      if (isEdit && fish) {
        const result = await updateFish(fish.id, formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (!result?.redirectTo) {
          setError("Unexpected error: missing redirect.");
          return;
        }
        toast.success("Fish updated.");
        router.push(result.redirectTo);
        // else {
        //   toast.success("Fish updated.");
        //   router.push(result.redirectTo);
        // }
      } else {
        const result = await createFish(formData);
        if (result?.error) {
          setError(result.error);
        }
        if (!result?.redirectTo) {
          setError("Unexpected error: missing redirect.");
          return;
        }
        toast.success("Fish created.");
        router.push(result.redirectTo);
        // else {
        //   toast.success("Fish created.");
        //   router.push(result.redirectTo);
        // }
      }
    });
  };

  const handleAiFill = async () => {
    if (!commonName) {
      toast.error("Enter a common name first.");
      return;
    }

    setIsAiLoading(true);

    try {
      const result = await generateFishData(
        commonName,
        waterProfiles.map((wp) => ({
          id: wp.id,
          name: wp.name,
        })),
      );

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      const data = result.data;

      setScientificName(data?.scientific_name ?? "");
      setDescription(data?.description ?? "");
      setOriginRegion(data?.origin_region ?? "");
      setWaterType(data?.water_type ?? "");
      setDifficultyLevel(data?.difficulty_level ?? "");
      setDiet(data?.diet ?? "");
      setMinTankLiters(
        data?.min_tank_liters ? String(data.min_tank_liters) : "",
      );

      // Match water profile by name
      if (data?.water_profile_name) {
        const matchedProfile = waterProfiles.find(
          (wp) =>
            wp.name.toLowerCase() === data.water_profile_name?.toLowerCase(),
        );

        if (matchedProfile) {
          setWaterProfileId(matchedProfile.id);
        }
      }

      toast.success("AI filled fields.");
    } catch (err) {
      toast.error("AI generation failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {/* Section: Basic Information */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Basic Information
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Common Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Common Name <span className="text-red-500">*</span>
              </label>
              <AiButton
                label="Auto-fill with AI"
                onClick={handleAiFill}
                loading={isAiLoading}
                disabled={commonName === ""}
              />
            </div>
            <input
              type="text"
              value={commonName}
              onChange={(e) => handleCommonNameChange(e.target.value)}
              required
              placeholder="e.g. Yellow Lab Cichlid"
              className={FIELD}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              URL Slug <span className="text-red-500">*</span>
              <span className="ml-2 font-normal text-slate-400 dark:text-slate-500 text-xs">
                (auto-generated, must be unique)
              </span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="e.g. yellow-lab-cichlid"
              className={FIELD}
            />
          </div>

          {/* Scientific Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Scientific Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
              required
              placeholder="e.g. Labidochromis caeruleus"
              className={FIELD}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the fish species…"
              className={TEXTAREA}
            />
          </div>

          {/* Origin Region */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Origin Region
            </label>
            <input
              type="text"
              value={originRegion}
              onChange={(e) => setOriginRegion(e.target.value)}
              placeholder="e.g. Lake Malawi, East Africa"
              className={FIELD}
            />
          </div>
        </div>
      </section>

      {/* Section: Classification */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Classification
          </h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Water Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Water Type
            </label>
            <select
              value={waterType}
              onChange={(e) => setWaterType(e.target.value)}
              className={SELECT}
            >
              <option value="">— Select —</option>
              <option value="freshwater">Freshwater</option>
              <option value="saltwater">Saltwater</option>
              <option value="brackish">Brackish</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Care Difficulty
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className={SELECT}
            >
              <option value="">— Select —</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Diet
            </label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className={SELECT}
            >
              <option value="">— Select —</option>
              <option value="Carnivore">Carnivore</option>
              <option value="Omnivore">Omnivore</option>
              <option value="Herbivore">Herbivore</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section: Care Requirements */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Care Requirements
          </h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Water Profile */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Water Profile
            </label>
            <select
              value={waterProfileId}
              onChange={(e) => setWaterProfileId(e.target.value)}
              className={SELECT}
            >
              <option value="">— None —</option>
              {waterProfiles.map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name}
                </option>
              ))}
            </select>
            {waterProfiles.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">
                No water profiles yet.{" "}
                <a
                  href="/admin/water-profiles/new"
                  className="text-teal-600 hover:underline"
                >
                  Create one
                </a>
              </p>
            )}
          </div>

          {/* Min Tank Size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Minimum Tank Size (liters)
            </label>
            <input
              type="number"
              value={minTankLiters}
              onChange={(e) => setMinTankLiters(e.target.value)}
              min="0"
              placeholder="e.g. 150"
              className={FIELD}
            />
          </div>
        </div>
      </section>

      {/* Section: Labels */}
      {allLabels.length > 0 && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Labels
            </h2>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {allLabels.map((label) => {
                const selected = selectedLabels.includes(label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-all cursor-pointer",
                      selected
                        ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-400",
                    )}
                    style={
                      selected && label.color
                        ? {
                            backgroundColor: label.color,
                            borderColor: label.color,
                          }
                        : !selected && label.color
                          ? {
                              borderColor: `${label.color}60`,
                              color: label.color,
                            }
                          : undefined
                    }
                  >
                    {label.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Section: Status */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Status
          </h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Published
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Make this species visible on the public wiki
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
                published ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-600",
              )}
              role="switch"
              aria-checked={published}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  published ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Save Changes" : "Create Fish"}
            </>
          )}
        </button>
        <a
          href="/admin/fish"
          className="rounded-lg border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
