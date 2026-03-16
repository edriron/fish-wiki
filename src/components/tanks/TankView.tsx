"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Fish,
  Leaf,
  LayoutList,
  Layers,
  ListTree,
  Search,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TankFishItem, TankPlantItem, TankLabel } from "@/types/tank";

interface Props {
  tankFish: TankFishItem[];
  tankPlants: TankPlantItem[];
  allLabels: TankLabel[];
}

// ── Label helpers ──────────────────────────────────────────────────────────────

function getRootLabel(labelId: string, labels: TankLabel[]): TankLabel | null {
  const map = new Map(labels.map((l) => [l.id, l]));
  let cur = map.get(labelId);
  if (!cur) return null;
  while (cur.parent_id) {
    const parent = map.get(cur.parent_id);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}

// First label whose root has is_grouping=true (used for flat category view)
function getGroupingRoot(fishLabels: TankLabel[], allLabels: TankLabel[]): TankLabel | null {
  for (const label of fishLabels) {
    const root = getRootLabel(label.id, allLabels) ?? label;
    if (root.is_grouping) return root;
  }
  return null;
}

// For a label, walk up collecting only is_grouping=true labels: [deepest, ..., root]
function getGroupingPath(labelId: string, labelMap: Map<string, TankLabel>): TankLabel[] {
  const path: TankLabel[] = [];
  let cur = labelMap.get(labelId);
  while (cur) {
    if (cur.is_grouping) path.push(cur);
    cur = cur.parent_id ? labelMap.get(cur.parent_id) : undefined;
  }
  return path;
}

// Best (longest) grouping path among all labels assigned to a fish
function bestGroupingPath(fishLabels: TankLabel[], labelMap: Map<string, TankLabel>): TankLabel[] {
  let best: TankLabel[] = [];
  for (const label of fishLabels) {
    const path = getGroupingPath(label.id, labelMap);
    if (path.length > best.length) best = path;
  }
  return best;
}

// Build hierarchy groups: each fish starts at its deepest label; singles bubble up
function buildHierarchyGroups(
  fish: TankFishItem[],
  allLabels: TankLabel[],
): { label: TankLabel | null; breadcrumb: TankLabel[]; fish: TankFishItem[] }[] {
  const labelMap = new Map(allLabels.map((l) => [l.id, l]));

  type FP = { tf: TankFishItem; path: TankLabel[]; level: number };
  const fps: FP[] = fish.map((tf) => {
    const labels = tf.fish_species.fish_labels.map((fl) => fl.labels).filter(Boolean) as TankLabel[];
    return { tf, path: bestGroupingPath(labels, labelMap), level: 0 };
  });

  // Iteratively push alone fish up one level until stable
  let changed = true;
  while (changed) {
    changed = false;
    const counts = new Map<string, number>();
    for (const fp of fps) {
      const key = fp.level < fp.path.length ? fp.path[fp.level].id : "__none__";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const fp of fps) {
      const key = fp.level < fp.path.length ? fp.path[fp.level].id : "__none__";
      if (key !== "__none__" && (counts.get(key) ?? 0) === 1 && fp.level < fp.path.length - 1) {
        fp.level++;
        changed = true;
      }
    }
  }

  // Build final groups preserving insertion order
  const groupMap = new Map<
    string,
    { label: TankLabel | null; breadcrumb: TankLabel[]; fish: TankFishItem[] }
  >();
  for (const fp of fps) {
    const label = fp.level < fp.path.length ? fp.path[fp.level] : null;
    const key = label?.id ?? "__none__";
    if (!groupMap.has(key)) {
      // breadcrumb: root→current = reverse path from fp.level onward
      const breadcrumb = fp.path.slice(fp.level).reverse();
      groupMap.set(key, { label, breadcrumb, fish: [] });
    }
    groupMap.get(key)!.fish.push(fp.tf);
  }
  return Array.from(groupMap.values());
}

// ── Image helper ───────────────────────────────────────────────────────────────

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

// ── Small image components ────────────────────────────────────────────────────

function FishImage({ src, alt }: { src: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-700">
        <Fish className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      </div>
    );
  return (
    <Image src={src} alt={alt} fill className="object-cover" sizes="48px" onError={() => setErr(true)} />
  );
}

function PlantImage({ src, alt }: { src: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-700">
        <Leaf className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      </div>
    );
  return (
    <Image src={src} alt={alt} fill className="object-cover" sizes="48px" onError={() => setErr(true)} />
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Shared fish card ───────────────────────────────────────────────────────────

function FishCard({ tf }: { tf: TankFishItem }) {
  const f = tf.fish_species;
  const img = getVariantImage(f.fish_images, tf.variant_id);
  const variantName = tf.variant_id
    ? (f.fish_variants.find((v) => v.id === tf.variant_id)?.name ?? "Variant")
    : null;
  return (
    <Link
      href={`/wiki/${f.slug}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-sm transition-all group"
    >
      <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
        <FishImage src={img} alt={f.common_name} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
            {f.common_name}
          </p>
          {variantName && (
            <span className="rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xs px-2 py-0.5 leading-none font-normal shrink-0">
              {variantName}
            </span>
          )}
        </div>
        <p className="text-xs italic text-slate-400 truncate">{f.scientific_name}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">×{tf.quantity}</span>
        {(tf.quantity_male > 0 || tf.quantity_female > 0) && (
          <div className="text-xs mt-0.5 whitespace-nowrap">
            {tf.quantity_male > 0 && <span className="text-blue-400">♂{tf.quantity_male}</span>}
            {tf.quantity_female > 0 && <span className="text-pink-400 ml-0.5">♀{tf.quantity_female}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Shared plants section ──────────────────────────────────────────────────────

function PlantsSection({ plants }: { plants: TankPlantItem[] }) {
  if (plants.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-3 rounded-full bg-green-400" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Plants & Corals</h3>
        <span className="text-xs text-slate-400">({plants.length} species)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plants.map((tp) => {
          const p = tp.plant_species;
          const img = p.plant_images.find((i) => i.is_primary)?.image_url ?? null;
          return (
            <Link
              key={tp.id}
              href={`/plants/${p.slug}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-sm transition-all group"
            >
              <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
                <PlantImage src={img} alt={p.common_name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                  {p.common_name}
                </p>
                <p className="text-xs italic text-slate-400 truncate">{p.scientific_name}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
                ×{tp.quantity}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Table view ────────────────────────────────────────────────────────────────

function TableView({ fish, plants }: { fish: TankFishItem[]; plants: TankPlantItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 w-12" />
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Name</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">
              Type
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">
              Details
            </th>
            <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800/50">
          {fish.map((tf) => {
            const f = tf.fish_species;
            const img = getVariantImage(f.fish_images, tf.variant_id);
            const variantName = tf.variant_id
              ? (f.fish_variants.find((v) => v.id === tf.variant_id)?.name ?? "Variant")
              : null;
            return (
              <tr key={tf.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                    <FishImage src={img} alt={f.common_name} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/wiki/${f.slug}`}
                    className="font-medium text-slate-900 dark:text-slate-100 hover:text-teal-700 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5 group"
                  >
                    {f.common_name}
                    {variantName && (
                      <span className="rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xs px-2 py-0.5 leading-none font-normal">
                        {variantName}
                      </span>
                    )}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-0.5">
                    {f.scientific_name}
                  </p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                    <Fish className="h-3 w-3" /> Fish
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500 dark:text-slate-400">
                  {f.diet && <span>{f.diet}</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{tf.quantity}</span>
                  {(tf.quantity_male > 0 || tf.quantity_female > 0) && (
                    <div className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                      {tf.quantity_male > 0 && <span className="text-blue-400">♂{tf.quantity_male}</span>}
                      {tf.quantity_female > 0 && <span className="text-pink-400 ml-1">♀{tf.quantity_female}</span>}
                      {tf.quantity - tf.quantity_male - tf.quantity_female > 0 && (
                        <span className="ml-1">?{tf.quantity - tf.quantity_male - tf.quantity_female}</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {plants.map((tp) => {
            const p = tp.plant_species;
            const img = p.plant_images.find((i) => i.is_primary)?.image_url ?? null;
            return (
              <tr key={tp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                    <PlantImage src={img} alt={p.common_name} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/plants/${p.slug}`}
                    className="font-medium text-slate-900 dark:text-slate-100 hover:text-teal-700 dark:hover:text-teal-400 transition-colors flex items-center gap-1 group"
                  >
                    {p.common_name}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-0.5">
                    {p.scientific_name}
                  </p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                    <Leaf className="h-3 w-3" />
                    {p.type === "coral" ? "Coral" : "Plant"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500 dark:text-slate-400">
                  {p.light_requirement && <span>{p.light_requirement} light</span>}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                  {tp.quantity}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Category view (flat root grouping) ────────────────────────────────────────

function CategoryView({
  fish,
  plants,
  allLabels,
}: {
  fish: TankFishItem[];
  plants: TankPlantItem[];
  allLabels: TankLabel[];
}) {
  const groups = useMemo(() => {
    const map = new Map<string, { label: TankLabel | null; fish: TankFishItem[] }>();
    for (const tf of fish) {
      const labels = tf.fish_species.fish_labels.map((fl) => fl.labels).filter(Boolean) as TankLabel[];
      const groupRoot = getGroupingRoot(labels, allLabels);
      const key = groupRoot?.id ?? "__none__";
      const existing = map.get(key);
      if (existing) existing.fish.push(tf);
      else map.set(key, { label: groupRoot, fish: [tf] });
    }
    return Array.from(map.values());
  }, [fish, allLabels]);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label?.id ?? "none"}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.label?.color ?? "#94a3b8" }} />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              {group.label?.name ?? "Uncategorized"}
            </h3>
            <span className="text-xs text-slate-400">({group.fish.length} species)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.fish.map((tf) => <FishCard key={tf.id} tf={tf} />)}
          </div>
        </div>
      ))}
      <PlantsSection plants={plants} />
    </div>
  );
}

// ── Hierarchy view (deepest possible grouping) ────────────────────────────────

function HierarchyView({
  fish,
  plants,
  allLabels,
}: {
  fish: TankFishItem[];
  plants: TankPlantItem[];
  allLabels: TankLabel[];
}) {
  const groups = useMemo(() => buildHierarchyGroups(fish, allLabels), [fish, allLabels]);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label?.id ?? "none"}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: group.label?.color ?? "#94a3b8" }}
            />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              {/* Desktop: full breadcrumb path */}
              {group.breadcrumb.length > 1 && (
                <span className="hidden sm:inline font-normal text-slate-400">
                  {group.breadcrumb.slice(0, -1).map((l) => l.name).join(" › ")}
                  {" › "}
                </span>
              )}
              {/* Always show the current (deepest) label */}
              {group.label?.name ?? "Uncategorized"}
            </h3>
            <span className="text-xs text-slate-400 shrink-0">({group.fish.length} species)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.fish.map((tf) => <FishCard key={tf.id} tf={tf} />)}
          </div>
        </div>
      ))}
      <PlantsSection plants={plants} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const VIEW_KEY = "tank-view";
type ViewMode = "table" | "category" | "hierarchy";

export function TankView({ tankFish, tankPlants, allLabels }: Props) {
  const [view, setView] = useState<ViewMode>("table");

  // Read persisted view after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "table" || v === "category" || v === "hierarchy") setView(v);
  }, []);
  const [filter, setFilter] = useState<"all" | "fish" | "plants">("all");
  const [search, setSearch] = useState("");

  const handleSetView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const filteredFish = useMemo(() => {
    if (filter === "plants") return [];
    const q = search.toLowerCase();
    return tankFish.filter(
      (tf) =>
        !q ||
        tf.fish_species.common_name.toLowerCase().includes(q) ||
        tf.fish_species.scientific_name.toLowerCase().includes(q),
    );
  }, [tankFish, filter, search]);

  const filteredPlants = useMemo(() => {
    if (filter === "fish") return [];
    const q = search.toLowerCase();
    return tankPlants.filter(
      (tp) =>
        !q ||
        tp.plant_species.common_name.toLowerCase().includes(q) ||
        tp.plant_species.scientific_name.toLowerCase().includes(q),
    );
  }, [tankPlants, filter, search]);

  const totalFishQty = tankFish.reduce((s, tf) => s + tf.quantity, 0);
  const totalPlantQty = tankPlants.reduce((s, tp) => s + tp.quantity, 0);
  const dietCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const tf of tankFish) {
      const d = tf.fish_species.diet ?? "Unknown";
      m[d] = (m[d] ?? 0) + tf.quantity;
    }
    return m;
  }, [tankFish]);

  const dietSummary = Object.entries(dietCounts).map(([d, c]) => `${c} ${d}`).join(" · ");

  const viewButtons: { id: ViewMode; title: string; icon: React.ReactNode }[] = [
    { id: "table", title: "Table view", icon: <LayoutList className="h-4 w-4" /> },
    { id: "category", title: "Category view", icon: <Layers className="h-4 w-4" /> },
    { id: "hierarchy", title: "Hierarchy view", icon: <ListTree className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Fish Species" value={tankFish.length} />
        <StatCard label="Total Livestock" value={totalFishQty + totalPlantQty} sub={`${totalFishQty} fish · ${totalPlantQty} plants`} />
        <StatCard label="Plant Species" value={tankPlants.length} />
        <StatCard label="Diet Mix" value={Object.keys(dietCounts).length} sub={dietSummary || "—"} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-45">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          />
        </div>

        <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
          {(["all", "fish", "plants"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filter === f
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
          {viewButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleSetView(btn.id)}
              title={btn.title}
              className={cn(
                "p-2 transition-colors",
                view === btn.id
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700",
              )}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filteredFish.length === 0 && filteredPlants.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
          {search ? "No matches found." : "No items in this view."}
        </div>
      ) : view === "table" ? (
        <TableView fish={filteredFish} plants={filteredPlants} />
      ) : view === "category" ? (
        <CategoryView fish={filteredFish} plants={filteredPlants} allLabels={allLabels} />
      ) : (
        <HierarchyView fish={filteredFish} plants={filteredPlants} allLabels={allLabels} />
      )}
    </div>
  );
}
