"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Pencil, ArrowUpDown, ArrowUp, ArrowDown, Search, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { togglePlantPublished, deletePlant } from "@/app/actions/plants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Plant = {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  type: string;
  water_type: string | null;
  difficulty: string | null;
  published: boolean;
  updated_at: string;
};

type SortKey = "common_name" | "scientific_name" | "type" | "difficulty" | "published" | "updated_at";
type SortDir = "asc" | "desc";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
}

function SortTh({ col, label, sortKey, sortDir, onSort, className }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (c: SortKey) => void; className?: string;
}) {
  const active = sortKey === col;
  return (
    <th className={cn("px-4 py-3", className)}>
      <button type="button" onClick={() => onSort(col)} className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
        {label}
        {active
          ? sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 shrink-0" /> : <ArrowDown className="h-3.5 w-3.5 shrink-0" />
          : <ArrowUpDown className="h-3.5 w-3.5 opacity-30 shrink-0" />}
      </button>
    </th>
  );
}

function PublishToggle({ plantId, published }: { plantId: string; published: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await togglePlantPublished(plantId, !published);
        router.refresh();
      })}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50",
        published ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-600"
      )}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto text-white" /> : (
        <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform", published ? "translate-x-4.5" : "translate-x-0.5")} />
      )}
    </button>
  );
}

function DeleteButton({ plantId, plantName }: { plantId: string; plantName: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete "${plantName}"? This cannot be undone.`)) return;
        startTransition(async () => {
          await deletePlant(plantId);
          toast.success("Deleted.");
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Delete
    </button>
  );
}

export function PlantTable({ plants }: { plants: Plant[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: SortKey) => {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return plants;
    return plants.filter((p) => p.common_name.toLowerCase().includes(q));
  }, [plants, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "updated_at") {
        const diff = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      if (sortKey === "published") {
        const diff = (a.published ? 1 : 0) - (b.published ? 1 : 0);
        return sortDir === "asc" ? diff : -diff;
      }
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      if (!av && bv) return 1;
      if (av && !bv) return -1;
      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const thProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name…"
            className="h-9 w-64 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        {search && <span className="text-sm text-slate-400">{sorted.length} of {plants.length} shown</span>}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                <SortTh col="common_name" label="Common Name" {...thProps} />
                <SortTh col="scientific_name" label="Scientific Name" {...thProps} className="hidden sm:table-cell" />
                <SortTh col="type" label="Type" {...thProps} className="hidden md:table-cell" />
                <SortTh col="difficulty" label="Difficulty" {...thProps} className="hidden lg:table-cell" />
                <SortTh col="published" label="Status" {...thProps} />
                <SortTh col="updated_at" label="Updated" {...thProps} className="hidden md:table-cell" />
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 italic">No entries match your search.</td>
                </tr>
              ) : sorted.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{p.common_name}</div>
                    <div className="text-xs text-slate-400 sm:hidden italic">{p.scientific_name}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 italic">{p.scientific_name}</td>
                  <td className="px-4 py-3 hidden md:table-cell capitalize text-slate-600 dark:text-slate-400">{p.type}</td>
                  <td className="px-4 py-3 hidden lg:table-cell capitalize text-slate-600 dark:text-slate-400">{p.difficulty ?? "—"}</td>
                  <td className="px-4 py-3"><PublishToggle plantId={p.id} published={p.published} /></td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400 tabular-nums text-xs">{formatDate(p.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/plants/${p.id}/edit`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />Edit
                      </Link>
                      <DeleteButton plantId={p.id} plantName={p.common_name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
