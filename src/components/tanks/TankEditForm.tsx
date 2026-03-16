"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Fish,
  Leaf,
  Plus,
  Minus,
  X,
  Search,
  Save,
  Loader2,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveTankContents, updateTank, deleteTank } from "@/app/actions/tanks";
import type { TankFishItem, TankPlantItem, FishBasic, PlantBasic } from "@/types/tank";

interface Props {
  tankId: string;
  tankName: string;
  tankDescription: string | null;
  tankVolume: number | null;
  tankType: string;
  initialFish: TankFishItem[];
  initialPlants: TankPlantItem[];
  allFish: FishBasic[];
  allPlants: PlantBasic[];
}

interface FishEntry {
  key: string; // fishId + '|' + (variantId ?? '')
  fishId: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  male: number;
  female: number;
  fish: FishBasic;
}
interface PlantEntry {
  plantId: string;
  quantity: number;
  plant: PlantBasic;
}

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";

function getVariantImage(
  images: { image_url: string; is_primary: boolean; variant_id: string | null }[],
  variantId: string | null,
): string | null {
  if (variantId) {
    const variantImgs = images.filter((i) => i.variant_id === variantId);
    if (variantImgs.length > 0)
      return variantImgs.find((i) => i.is_primary)?.image_url ?? variantImgs[0].image_url;
  }
  return images.find((i) => i.is_primary)?.image_url ?? images[0]?.image_url ?? null;
}

function ThumbImage({ src, alt, isPlant }: { src: string | null; alt: string; isPlant?: boolean }) {
  const [err, setErr] = useState(false);
  const Icon = isPlant ? Leaf : Fish;
  if (!src || err)
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-700">
        <Icon className="h-4 w-4 text-slate-300 dark:text-slate-500" />
      </div>
    );
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="40px"
      onError={() => setErr(true)}
    />
  );
}

export function TankEditForm({
  tankId,
  tankName,
  tankDescription,
  tankVolume,
  tankType,
  initialFish,
  initialPlants,
  allFish,
  allPlants,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fish" | "plants">("fish");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Tank metadata
  const [name, setName] = useState(tankName);
  const [description, setDescription] = useState(tankDescription ?? "");
  const [volume, setVolume] = useState(tankVolume?.toString() ?? "");
  const [waterType, setWaterType] = useState(tankType ?? "freshwater");

  // Build fish basic map for quick lookup
  const fishMap = useMemo(() => new Map(allFish.map((f) => [f.id, f])), [allFish]);
  const plantMap = useMemo(() => new Map(allPlants.map((p) => [p.id, p])), [allPlants]);

  // Current entries
  const [fishEntries, setFishEntries] = useState<FishEntry[]>(() =>
    initialFish
      .map((tf) => {
        const fish = (tf.fish_species as unknown as FishBasic) ?? fishMap.get(tf.fish_id);
        if (!fish) return null;
        const variantId = tf.variant_id ?? null;
        const variantName = variantId
          ? (fish.fish_variants?.find((v) => v.id === variantId)?.name ?? null)
          : null;
        const key = tf.fish_id + "|" + (variantId ?? "");
        return { key, fishId: tf.fish_id, variantId, variantName, quantity: tf.quantity, male: tf.quantity_male ?? 0, female: tf.quantity_female ?? 0, fish };
      })
      .filter(Boolean) as FishEntry[],
  );
  const [plantEntries, setPlantEntries] = useState<PlantEntry[]>(() =>
    initialPlants
      .map((tp) => {
        const plant = (tp.plant_species as unknown as PlantBasic) ?? plantMap.get(tp.plant_id);
        if (!plant) return null;
        return { plantId: tp.plant_id, quantity: tp.quantity, plant };
      })
      .filter(Boolean) as PlantEntry[],
  );

  // Search & expand
  const [fishSearch, setFishSearch] = useState("");
  const [plantSearch, setPlantSearch] = useState("");
  const [expandedFishId, setExpandedFishId] = useState<string | null>(null);

  const addedCombos = useMemo(() => new Set(fishEntries.map((e) => e.key)), [fishEntries]);
  const addedPlantIds = useMemo(() => new Set(plantEntries.map((e) => e.plantId)), [plantEntries]);

  const filteredFish = useMemo(() => {
    const q = fishSearch.toLowerCase();
    return allFish.filter((f) => {
      const matches =
        !q ||
        f.common_name.toLowerCase().includes(q) ||
        f.scientific_name.toLowerCase().includes(q);
      if (!matches) return false;
      // Hide no-variant fish already added; always show fish with variants
      if (f.fish_variants.length === 0) return !addedCombos.has(f.id + "|");
      return true;
    });
  }, [allFish, addedCombos, fishSearch]);

  const filteredPlants = useMemo(() => {
    const q = plantSearch.toLowerCase();
    return allPlants.filter(
      (p) =>
        !addedPlantIds.has(p.id) &&
        (!q ||
          p.common_name.toLowerCase().includes(q) ||
          p.scientific_name.toLowerCase().includes(q)),
    );
  }, [allPlants, addedPlantIds, plantSearch]);

  const addFish = (f: FishBasic, variantId: string | null = null, variantName: string | null = null) => {
    const key = f.id + "|" + (variantId ?? "");
    if (addedCombos.has(key)) return;
    setFishEntries((prev) => [...prev, { key, fishId: f.id, variantId, variantName, quantity: 1, male: 0, female: 0, fish: f }]);
  };
  const removeFish = (key: string) => setFishEntries((prev) => prev.filter((e) => e.key !== key));
  const changeFishQty = (key: string, delta: number) =>
    setFishEntries((prev) =>
      prev.map((e) => {
        if (e.key !== key) return e;
        const qty = Math.max(1, e.quantity + delta);
        const male = Math.min(e.male, qty);
        const female = Math.min(e.female, qty - male);
        return { ...e, quantity: qty, male, female };
      }),
    );
  const changeFishMale = (key: string, delta: number) =>
    setFishEntries((prev) =>
      prev.map((e) =>
        e.key === key
          ? { ...e, male: Math.max(0, Math.min(e.quantity - e.female, e.male + delta)) }
          : e,
      ),
    );
  const changeFishFemale = (key: string, delta: number) =>
    setFishEntries((prev) =>
      prev.map((e) =>
        e.key === key
          ? { ...e, female: Math.max(0, Math.min(e.quantity - e.male, e.female + delta)) }
          : e,
      ),
    );

  const addPlant = (p: PlantBasic) =>
    setPlantEntries((prev) => [...prev, { plantId: p.id, quantity: 1, plant: p }]);
  const removePlant = (id: string) =>
    setPlantEntries((prev) => prev.filter((e) => e.plantId !== id));
  const changePlantQty = (id: string, delta: number) =>
    setPlantEntries((prev) =>
      prev.map((e) =>
        e.plantId === id ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e,
      ),
    );

  const handleSave = () => {
    if (!name.trim()) {
      setError("Tank name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("description", description);
      fd.set("volume_liters", volume);
      fd.set("tank_type", waterType);
      const metaResult = await updateTank(tankId, fd);
      if (metaResult?.error) {
        setError(metaResult.error);
        return;
      }

      const contentsResult = await saveTankContents(
        tankId,
        fishEntries.map((e) => ({ fishId: e.fishId, quantity: e.quantity, male: e.male, female: e.female, variantId: e.variantId })),
        plantEntries.map((e) => ({ plantId: e.plantId, quantity: e.quantity })),
      );
      if (contentsResult?.error) {
        setError(contentsResult.error);
        return;
      }

      toast.success("Tank saved.");
      router.push(`/my-tanks/${tankId}`);
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tank metadata */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Tank Details
          </h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={FIELD}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Volume (L)
            </label>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              min="1"
              className={FIELD}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Water Type
            </label>
            <select
              value={waterType}
              onChange={(e) => setWaterType(e.target.value)}
              className={cn(FIELD, "cursor-pointer")}
            >
              <option value="freshwater">🌿 Freshwater</option>
              <option value="brackish">💧 Brackish</option>
              <option value="reef">🪸 Reef</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this tank…"
              className={FIELD}
            />
          </div>
        </div>
      </section>

      {/* Contents editor */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("fish")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "fish"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <Fish className="h-4 w-4" />
            Fish
            {fishEntries.length > 0 && (
              <span className="rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xs px-2 py-0.5">
                {fishEntries.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("plants")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "plants"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <Leaf className="h-4 w-4" />
            Plants & Corals
            {plantEntries.length > 0 && (
              <span className="rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xs px-2 py-0.5">
                {plantEntries.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-5">
          {activeTab === "fish" ? (
            <div className="space-y-4">
              {/* Current fish */}
              {fishEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    In tank
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
                  {fishEntries.map((entry) => {
                    const img = getVariantImage(entry.fish.fish_images, entry.variantId);
                    const unknown = entry.quantity - entry.male - entry.female;
                    const btnSm = "h-5 w-5 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs leading-none";
                    return (
                      <div
                        key={entry.key}
                        className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-2.5"
                      >
                        {/* Main row */}
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                            <ThumbImage src={img} alt={entry.fish.common_name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {entry.fish.common_name}
                              </p>
                              {entry.variantName && (
                                <span className="rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xs px-2 py-0.5 leading-none font-normal shrink-0">
                                  {entry.variantName}
                                </span>
                              )}
                            </div>
                            <p className="text-xs italic text-slate-400 truncate">
                              {entry.fish.scientific_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => changeFishQty(entry.key, -1)}
                              className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {entry.quantity}
                            </span>
                            <button type="button" onClick={() => changeFishQty(entry.key, 1)}
                              className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => removeFish(entry.key)}
                              className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-1">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Gender strip */}
                        <div className="flex items-center gap-2 mt-2 pl-[52px]">
                          <span className="text-xs text-blue-500">♂</span>
                          <button type="button" onClick={() => changeFishMale(entry.key, -1)} className={btnSm}>−</button>
                          <span className="w-4 text-center text-xs font-medium text-slate-700 dark:text-slate-300">{entry.male}</span>
                          <button type="button" onClick={() => changeFishMale(entry.key, 1)} className={btnSm}>+</button>
                          <span className="text-xs text-pink-500 ml-2">♀</span>
                          <button type="button" onClick={() => changeFishFemale(entry.key, -1)} className={btnSm}>−</button>
                          <span className="w-4 text-center text-xs font-medium text-slate-700 dark:text-slate-300">{entry.female}</span>
                          <button type="button" onClick={() => changeFishFemale(entry.key, 1)} className={btnSm}>+</button>
                          <span className="text-xs text-slate-400 ml-2">? <span className="font-medium text-slate-500 dark:text-slate-400">{unknown}</span></span>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {/* Search to add */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Add fish
                </p>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={fishSearch}
                    onChange={(e) => setFishSearch(e.target.value)}
                    placeholder="Search fish…"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-1">
                  {filteredFish.length === 0 ? (
                    <p className="text-center py-4 text-sm text-slate-400">
                      {fishSearch ? "No matches." : "All fish added."}
                    </p>
                  ) : (
                    <div className="space-y-0.5">
                    {filteredFish.slice(0, 50).map((f) => {
                      const img = f.fish_images.find((i) => i.is_primary)?.image_url ??
                        f.fish_images[0]?.image_url ?? null;
                      const hasVariants = f.fish_variants.length > 0;
                      const isExpanded = expandedFishId === f.id;

                      return (
                        <div key={f.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (hasVariants) {
                                setExpandedFishId(isExpanded ? null : f.id);
                              } else {
                                addFish(f);
                              }
                            }}
                            className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 hover:bg-white dark:hover:bg-slate-700 transition-colors text-left group"
                          >
                            <div className="relative h-8 w-8 rounded-md overflow-hidden shrink-0">
                              <ThumbImage src={img} alt={f.common_name} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                {f.common_name}
                              </p>
                              <p className="text-xs italic text-slate-400 truncate">
                                {f.scientific_name}
                              </p>
                            </div>
                            {hasVariants ? (
                              <div className="shrink-0 flex items-center gap-1 text-xs text-slate-400">
                                <span>{f.fish_variants.length} variants</span>
                                {isExpanded
                                  ? <ChevronUp className="h-4 w-4" />
                                  : <ChevronDown className="h-4 w-4" />}
                              </div>
                            ) : (
                              <Plus className="h-4 w-4 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                          </button>

                          {/* Variant picker */}
                          {hasVariants && isExpanded && (
                            <div className="ml-10 mr-1 mb-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden">
                              {/* Standard (no variant) */}
                              <button
                                type="button"
                                disabled={addedCombos.has(f.id + "|")}
                                onClick={() => addFish(f, null, null)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors border-b border-slate-100 dark:border-slate-700",
                                  addedCombos.has(f.id + "|")
                                    ? "text-slate-300 dark:text-slate-600 cursor-default"
                                    : "hover:bg-teal-50 dark:hover:bg-teal-900/20 text-slate-700 dark:text-slate-300",
                                )}
                              >
                                <span>Standard</span>
                                {addedCombos.has(f.id + "|") ? (
                                  <span className="text-xs text-slate-400">In tank</span>
                                ) : (
                                  <Plus className="h-3.5 w-3.5 text-teal-600" />
                                )}
                              </button>
                              {/* Each variant */}
                              {f.fish_variants.map((v, vi) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  disabled={addedCombos.has(f.id + "|" + v.id)}
                                  onClick={() => addFish(f, v.id, v.name)}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                                    vi < f.fish_variants.length - 1 && "border-b border-slate-100 dark:border-slate-700",
                                    addedCombos.has(f.id + "|" + v.id)
                                      ? "text-slate-300 dark:text-slate-600 cursor-default"
                                      : "hover:bg-teal-50 dark:hover:bg-teal-900/20 text-slate-700 dark:text-slate-300",
                                  )}
                                >
                                  <span>{v.name}</span>
                                  {addedCombos.has(f.id + "|" + v.id) ? (
                                    <span className="text-xs text-slate-400">In tank</span>
                                  ) : (
                                    <Plus className="h-3.5 w-3.5 text-teal-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current plants */}
              {plantEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    In tank
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
                  {plantEntries.map((entry) => {
                    const img =
                      entry.plant.plant_images.find((i) => i.is_primary)?.image_url ??
                      entry.plant.plant_images[0]?.image_url ?? null;
                    return (
                      <div
                        key={entry.plantId}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-2.5"
                      >
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                          <ThumbImage src={img} alt={entry.plant.common_name} isPlant />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {entry.plant.common_name}
                          </p>
                          <p className="text-xs italic text-slate-400 truncate">
                            {entry.plant.scientific_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => changePlantQty(entry.plantId, -1)}
                            className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changePlantQty(entry.plantId, 1)}
                            className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePlant(entry.plantId)}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {/* Search to add */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Add plants & corals
                </p>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={plantSearch}
                    onChange={(e) => setPlantSearch(e.target.value)}
                    placeholder="Search plants…"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-1">
                  {filteredPlants.length === 0 ? (
                    <p className="text-center py-4 text-sm text-slate-400">
                      {plantSearch ? "No matches." : "All plants added."}
                    </p>
                  ) : (
                    filteredPlants.slice(0, 50).map((p) => {
                      const img = p.plant_images.find((i) => i.is_primary)?.image_url ??
                        p.plant_images[0]?.image_url ?? null;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addPlant(p)}
                          className="w-full flex items-center gap-3 rounded-md px-2.5 py-2 hover:bg-white dark:hover:bg-slate-700 transition-colors text-left group"
                        >
                          <div className="relative h-8 w-8 rounded-md overflow-hidden shrink-0">
                            <ThumbImage src={img} alt={p.common_name} isPlant />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {p.common_name}
                            </p>
                            <p className="text-xs italic text-slate-400 truncate">
                              {p.scientific_name}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
          ) : (
            <><Save className="h-4 w-4" />Save Tank</>
          )}
        </button>
        <Link
          href={`/my-tanks/${tankId}`}
          className="rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-300">Delete this tank</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
            Permanently removes the tank and all its contents.
          </p>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-red-700 dark:text-red-400">Are you sure?</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteTank(tankId);
                  toast.success("Tank deleted.");
                  router.push("/my-tanks");
                });
              }}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Tank
          </button>
        )}
      </div>
    </div>
  );
}
