"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toSlug } from "@/lib/slug";
import { createPlant, updatePlant } from "@/app/actions/plants";
import type { PlantSpecies } from "@/types/plant";

interface PlantFormProps {
  plant?: PlantSpecies;
}

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
const TEXTAREA =
  "w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none";
const SELECT = cn(FIELD, "cursor-pointer");

export function PlantForm({ plant }: PlantFormProps) {
  const isEdit = Boolean(plant);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [commonName, setCommonName] = useState(plant?.common_name ?? "");
  const [slug, setSlug] = useState(plant?.slug ?? "");
  const [scientificName, setScientificName] = useState(
    plant?.scientific_name ?? "",
  );
  const [type, setType] = useState<"plant" | "coral">(plant?.type ?? "plant");
  const [description, setDescription] = useState(plant?.description ?? "");
  const [lightRequirement, setLightRequirement] = useState(
    plant?.light_requirement ?? "",
  );
  const [co2Requirement, setCo2Requirement] = useState(
    plant?.co2_requirement ?? "",
  );
  const [difficulty, setDifficulty] = useState(plant?.difficulty ?? "");
  const [substrate, setSubstrate] = useState<string>(
    plant?.substrate === true
      ? "true"
      : plant?.substrate === false
        ? "false"
        : "",
  );
  const [growthRate, setGrowthRate] = useState(plant?.growth_rate ?? "");
  const [tempMin, setTempMin] = useState(plant?.temp_min?.toString() ?? "");
  const [tempMax, setTempMax] = useState(plant?.temp_max?.toString() ?? "");
  const [waterType, setWaterType] = useState(plant?.water_type ?? "");
  const [originRegion, setOriginRegion] = useState(plant?.origin_region ?? "");
  const [primaryImageUrl, setPrimaryImageUrl] = useState(
    plant?.primary_image_url ?? "",
  );
  const [published, setPublished] = useState(plant?.published ?? false);

  const handleNameChange = (value: string) => {
    setCommonName(value);
    if (!isEdit) setSlug(toSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("common_name", commonName);
    formData.set("slug", slug);
    formData.set("scientific_name", scientificName);
    formData.set("type", type);
    formData.set("description", description);
    formData.set("light_requirement", lightRequirement);
    formData.set("co2_requirement", co2Requirement);
    formData.set("difficulty", difficulty);
    formData.set("substrate", substrate);
    formData.set("growth_rate", growthRate);
    formData.set("temp_min", tempMin);
    formData.set("temp_max", tempMax);
    formData.set("water_type", waterType);
    formData.set("origin_region", originRegion);
    formData.set("primary_image_url", primaryImageUrl);
    formData.set("published", published ? "true" : "false");

    startTransition(async () => {
      if (isEdit && plant) {
        const result = await updatePlant(plant.id, formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        toast.success("Saved.");
        router.push("/admin/plants");
      } else {
        const result = await createPlant(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        toast.success("Created.");
        router.push(result.redirectTo ?? "/admin/plants");
      }
    });
  };

  const isPlant = type === "plant";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Basic Information
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Common Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={commonName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="e.g. Java Fern"
                className={FIELD}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="e.g. java-fern"
                className={FIELD}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Scientific Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                required
                placeholder="e.g. Microsorum pteropus"
                className={FIELD}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "plant" | "coral")}
                className={SELECT}
              >
                <option value="plant">Plant</option>
                <option value="coral">Coral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe this species…"
              className={TEXTAREA}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Origin Region
            </label>
            <input
              type="text"
              value={originRegion}
              onChange={(e) => setOriginRegion(e.target.value)}
              placeholder="e.g. Southeast Asia"
              className={FIELD}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Primary Image URL
            </label>
            <input
              type="url"
              value={primaryImageUrl}
              onChange={(e) => setPrimaryImageUrl(e.target.value)}
              placeholder="https://..."
              className={FIELD}
            />
          </div>
        </div>
      </section>

      {/* Care Requirements */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Care Requirements
          </h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={SELECT}
            >
              <option value="">— Select —</option>
              <option value="easy">Easy</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Light Requirement
            </label>
            <select
              value={lightRequirement}
              onChange={(e) => setLightRequirement(e.target.value)}
              className={SELECT}
            >
              <option value="">— Select —</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Growth Rate
            </label>
            <select
              value={growthRate}
              onChange={(e) => setGrowthRate(e.target.value)}
              className={SELECT}
            >
              <option value="">— Select —</option>
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </div>

          {isPlant && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  CO₂ Requirement
                </label>
                <select
                  value={co2Requirement}
                  onChange={(e) => setCo2Requirement(e.target.value)}
                  className={SELECT}
                >
                  <option value="">— Select —</option>
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Substrate Required
                </label>
                <select
                  value={substrate}
                  onChange={(e) => setSubstrate(e.target.value)}
                  className={SELECT}
                >
                  <option value="">— Select —</option>
                  <option value="true">Yes</option>
                  <option value="false">No (can float / attach)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Temp Min (°C)
            </label>
            <input
              type="number"
              value={tempMin}
              onChange={(e) => setTempMin(e.target.value)}
              min="0"
              step="0.5"
              placeholder="e.g. 20"
              className={FIELD}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Temp Max (°C)
            </label>
            <input
              type="number"
              value={tempMax}
              onChange={(e) => setTempMax(e.target.value)}
              min="0"
              step="0.5"
              placeholder="e.g. 28"
              className={FIELD}
            />
          </div>
        </div>
      </section>

      {/* Status */}
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
              {isEdit ? "Save Changes" : "Create"}
            </>
          )}
        </button>
        <a
          href="/admin/plants"
          className="rounded-lg border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
