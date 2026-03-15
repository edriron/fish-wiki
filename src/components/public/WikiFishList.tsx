"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Fish, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { FishCard } from "@/components/public/FishCard";
import { PlantCard } from "@/components/public/PlantCard";
import type { FishCardData, FishLabel } from "@/types/fish";
import type { PlantCardData } from "@/types/plant";

function getSubtreeIds(id: string, labels: FishLabel[]): string[] {
  const result = [id];
  for (const l of labels) {
    if (l.parent_id === id) result.push(...getSubtreeIds(l.id, labels));
  }
  return result;
}

const WATER_TYPES = [
  { label: "All", value: null },
  { label: "Freshwater", value: "freshwater" },
  { label: "Saltwater", value: "saltwater" },
  { label: "Brackish", value: "brackish" },
];

interface Props {
  fish: FishCardData[];
  plants: PlantCardData[];
  labels: FishLabel[];
  initialQ: string;
  initialLabel: string | null;
  initialWaterType: string | null;
  initialTab: "fish" | "plants";
}

export function WikiFishList({
  fish,
  plants,
  labels,
  initialQ,
  initialLabel,
  initialWaterType,
  initialTab,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"fish" | "plants">(initialTab);
  const [search, setSearch] = useState(initialQ);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(initialLabel);
  const [waterType, setWaterType] = useState<string | null>(initialWaterType);

  const syncUrl = (
    q: string,
    label: string | null,
    wt: string | null,
    t: "fish" | "plants",
  ) => {
    const params = new URLSearchParams();
    if (t !== "fish") params.set("tab", t);
    if (q.trim()) params.set("q", q.trim());
    if (label) params.set("label", label);
    if (wt) params.set("water_type", wt);
    const qs = params.toString();
    router.replace(`/wiki${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleTab = (t: "fish" | "plants") => {
    setTab(t);
    setSearch("");
    setSelectedLabel(null);
    syncUrl("", null, waterType, t);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    syncUrl(value, selectedLabel, waterType, tab);
  };

  const handleLabel = (labelId: string | null) => {
    setSelectedLabel(labelId);
    syncUrl(search, labelId, waterType, tab);
  };

  const handleWaterType = (wt: string | null) => {
    setWaterType(wt);
    syncUrl(search, selectedLabel, wt, tab);
  };

  const filteredFish = useMemo(() => {
    let result = fish;
    if (waterType) result = result.filter((f) => f.water_type?.toLowerCase() === waterType);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((f) =>
      f.common_name.toLowerCase().includes(q) ||
      (f.scientific_name?.toLowerCase().includes(q) ?? false)
    );
    if (selectedLabel) {
      const subtreeIds = getSubtreeIds(selectedLabel, labels);
      result = result.filter((f) => f.labels.some((l) => subtreeIds.includes(l.id)));
    }
    return result;
  }, [fish, search, selectedLabel, waterType, labels]);

  const filteredPlants = useMemo(() => {
    let result = plants;
    if (waterType) result = result.filter((p) => p.water_type?.toLowerCase() === waterType);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((p) =>
      p.common_name.toLowerCase().includes(q) ||
      p.scientific_name.toLowerCase().includes(q)
    );
    return result;
  }, [plants, search, waterType]);

  const currentItems = tab === "fish" ? filteredFish : filteredPlants;

  return (
    <>
      {/* Tab switcher */}
      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0">
        {([
          { value: "fish" as const, label: "Fish", Icon: Fish },
          { value: "plants" as const, label: "Plants & Corals", Icon: Leaf },
        ]).map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => handleTab(value)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === value
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Water type filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {WATER_TYPES.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => handleWaterType(value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
              waterType === value
                ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={tab === "fish" ? "Search fish by name…" : "Search plants & corals…"}
          className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-9 pr-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {search && (
          <button type="button" onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Label filter — fish only */}
      {tab === "fish" && labels.length > 0 && (
        <div className="mb-6 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-white dark:from-slate-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white dark:from-slate-950 to-transparent" />
          <div className="flex gap-2 overflow-x-auto pb-3 px-1 scroll-smooth">
            <button
              onClick={() => handleLabel(null)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                !selectedLabel
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400",
              )}
            >
              All Species
            </button>
            {labels.map((label) => {
              const isSelected = selectedLabel === label.id;
              return (
                <button
                  key={label.id}
                  onClick={() => handleLabel(isSelected ? null : label.id)}
                  className={cn(
                    "shrink-0 cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                    isSelected
                      ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400",
                  )}
                  style={
                    isSelected && label.color
                      ? { backgroundColor: label.color, borderColor: label.color }
                      : label.color && !isSelected
                        ? { borderColor: `${label.color}50`, color: label.color }
                        : undefined
                  }
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Count */}
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">{currentItems.length}</span>{" "}
        {tab === "fish" ? "species" : "entries"} found
        {search.trim() && (
          <> for <span className="font-medium text-slate-900 dark:text-slate-100">&ldquo;{search.trim()}&rdquo;</span></>
        )}
      </p>

      {/* Grid */}
      {currentItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            {tab === "fish"
              ? <Fish className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              : <Leaf className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Nothing found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {search ? `No results for "${search}".` : "No entries match the current filters."}
          </p>
        </div>
      ) : tab === "fish" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(filteredFish).map((f) => <FishCard key={f.id} fish={f} allLabels={labels} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(filteredPlants).map((p) => (
            <div key={p.id} className="flex flex-col gap-1">
              <PlantCard plant={p} />
              {p.type === "coral"
                ? <span className="sr-only">coral</span>
                : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
