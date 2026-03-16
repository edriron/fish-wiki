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
  fishId: string;
  quantity: number;
  fish: FishBasic;
}
interface PlantEntry {
  plantId: string;
  quantity: number;
  plant: PlantBasic;
}

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";

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
        const fish = fishMap.get(tf.fish_id);
        if (!fish) return null;
        return { fishId: tf.fish_id, quantity: tf.quantity, fish };
      })
      .filter(Boolean) as FishEntry[],
  );
  const [plantEntries, setPlantEntries] = useState<PlantEntry[]>(() =>
    initialPlants
      .map((tp) => {
        const plant = plantMap.get(tp.plant_id);
        if (!plant) return null;
        return { plantId: tp.plant_id, quantity: tp.quantity, plant };
      })
      .filter(Boolean) as PlantEntry[],
  );

  // Search
  const [fishSearch, setFishSearch] = useState("");
  const [plantSearch, setPlantSearch] = useState("");

  const addedFishIds = useMemo(() => new Set(fishEntries.map((e) => e.fishId)), [fishEntries]);
  const addedPlantIds = useMemo(() => new Set(plantEntries.map((e) => e.plantId)), [plantEntries]);

  const filteredFish = useMemo(() => {
    const q = fishSearch.toLowerCase();
    return allFish.filter(
      (f) =>
        !addedFishIds.has(f.id) &&
        (!q ||
          f.common_name.toLowerCase().includes(q) ||
          f.scientific_name.toLowerCase().includes(q)),
    );
  }, [allFish, addedFishIds, fishSearch]);

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

  const addFish = (f: FishBasic) =>
    setFishEntries((prev) => [...prev, { fishId: f.id, quantity: 1, fish: f }]);
  const removeFish = (id: string) => setFishEntries((prev) => prev.filter((e) => e.fishId !== id));
  const changeFishQty = (id: string, delta: number) =>
    setFishEntries((prev) =>
      prev.map((e) =>
        e.fishId === id ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e,
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
      // Save metadata
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

      // Save contents
      const contentsResult = await saveTankContents(
        tankId,
        fishEntries.map((e) => ({ fishId: e.fishId, quantity: e.quantity })),
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
                    const img =
                      entry.fish.fish_images.find((i) => i.is_primary)?.image_url ??
                      entry.fish.fish_images[0]?.image_url ?? null;
                    return (
                      <div
                        key={entry.fishId}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-2.5"
                      >
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                          <ThumbImage src={img} alt={entry.fish.common_name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {entry.fish.common_name}
                          </p>
                          <p className="text-xs italic text-slate-400 truncate">
                            {entry.fish.scientific_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => changeFishQty(entry.fishId, -1)}
                            className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeFishQty(entry.fishId, 1)}
                            className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFish(entry.fishId)}
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
                <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-1">
                  {filteredFish.length === 0 ? (
                    <p className="text-center py-4 text-sm text-slate-400">
                      {fishSearch ? "No matches." : "All fish added."}
                    </p>
                  ) : (
                    filteredFish.slice(0, 50).map((f) => {
                      const img = f.fish_images.find((i) => i.is_primary)?.image_url ??
                        f.fish_images[0]?.image_url ?? null;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => addFish(f)}
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
                          <Plus className="h-4 w-4 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      );
                    })
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
