"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Fish } from "lucide-react";
import { cn } from "@/lib/utils";
import { FishCard } from "@/components/public/FishCard";
import type { FishCardData, FishLabel } from "@/types/fish";

function getSubtreeIds(id: string, labels: FishLabel[]): string[] {
  const result = [id];
  for (const l of labels) {
    if (l.parent_id === id) result.push(...getSubtreeIds(l.id, labels));
  }
  return result;
}

interface Props {
  fish: FishCardData[];
  labels: FishLabel[];
  initialQ: string;
  initialLabel: string | null;
  initialWaterType: string | null;
}

export function WikiFishList({
  fish,
  labels,
  initialQ,
  initialLabel,
  initialWaterType,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQ);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    initialLabel,
  );
  const [waterType] = useState<string | null>(initialWaterType);

  const syncUrl = (q: string, label: string | null) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (label) params.set("label", label);
    if (waterType) params.set("water_type", waterType);
    const qs = params.toString();
    router.replace(`/wiki${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    syncUrl(value, selectedLabel);
  };

  const handleLabel = (labelId: string | null) => {
    setSelectedLabel(labelId);
    syncUrl(search, labelId);
  };

  const filtered = useMemo(() => {
    let result = fish;

    // Water type (server pre-filters, but also apply client-side to keep state consistent)
    if (waterType) {
      result = result.filter(
        (f) => f.water_type?.toLowerCase() === waterType.toLowerCase(),
      );
    }

    // Text search
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (f) =>
          f.common_name.toLowerCase().includes(q) ||
          (f.scientific_name?.toLowerCase().includes(q) ?? false),
      );
    }

    // Label filter — includes subtree descendants
    if (selectedLabel) {
      const subtreeIds = getSubtreeIds(selectedLabel, labels);
      result = result.filter((f) =>
        f.labels.some((l) => subtreeIds.includes(l.id)),
      );
    }

    return result;
  }, [fish, search, selectedLabel, waterType, labels]);

  return (
    <>
      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search fish by name..."
          className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-9 pr-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Label filter */}
      {labels.length > 0 && (
        <div className="mb-6 relative">
          {/* Fade edges — matches page background */}
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
                      ? {
                          backgroundColor: label.color,
                          borderColor: label.color,
                        }
                      : label.color && !isSelected
                        ? {
                            borderColor: `${label.color}50`,
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
      )}

      {/* Count */}
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {filtered.length}
        </span>{" "}
        species found
        {search.trim() && (
          <>
            {" "}
            for{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              &ldquo;{search.trim()}&rdquo;
            </span>
          </>
        )}
      </p>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Fish className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            No fish found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {search
              ? `No results for "${search}". Try a different search term.`
              : "No species match the current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((f) => (
            <FishCard key={f.id} fish={f} allLabels={labels} />
          ))}
        </div>
      )}
    </>
  );
}
