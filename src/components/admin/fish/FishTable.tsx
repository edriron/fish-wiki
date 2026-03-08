"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublishToggle } from "./PublishToggle";
import { FishDeleteButton } from "./FishDeleteButton";

type Fish = {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string | null;
  water_type: string | null;
  difficulty_level: string | null;
  published: boolean;
  updated_at: string;
};

type SortKey = "common_name" | "scientific_name" | "water_type" | "difficulty_level" | "published" | "updated_at";
type SortDir = "asc" | "desc";

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(2);
  return `${day}/${month}/${year}`;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-30 shrink-0" />;
  return dir === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 shrink-0" />
    : <ArrowDown className="h-3.5 w-3.5 shrink-0" />;
}

function SortTh({
  col, label, sortKey, sortDir, onSort, className,
}: {
  col: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3", className)}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        {label}
        <SortIcon active={sortKey === col} dir={sortDir} />
      </button>
    </th>
  );
}

export function FishTable({ fish }: { fish: Fish[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: SortKey) => {
    if (sortKey === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return fish;
    return fish.filter((f) => f.common_name.toLowerCase().includes(q));
  }, [fish, search]);

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
      // Push empty values to end regardless of direction
      if (!av && bv) return 1;
      if (av && !bv) return -1;
      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const thProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search common name…"
            className="h-9 w-64 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {search && (
          <span className="text-sm text-slate-400 dark:text-slate-500">
            {sorted.length} of {fish.length} shown
          </span>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                <SortTh col="common_name" label="Common Name" {...thProps} />
                <SortTh col="scientific_name" label="Scientific Name" {...thProps} className="hidden sm:table-cell" />
                <SortTh col="water_type" label="Water Type" {...thProps} className="hidden md:table-cell" />
                <SortTh col="difficulty_level" label="Difficulty" {...thProps} className="hidden lg:table-cell" />
                <SortTh col="published" label="Status" {...thProps} />
                <SortTh col="updated_at" label="Updated" {...thProps} className="hidden md:table-cell" />
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 italic">
                    No species match your search.
                  </td>
                </tr>
              ) : (
                sorted.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{f.common_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 sm:hidden italic">
                        {f.scientific_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 italic">
                      {f.scientific_name}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {f.water_type ? (
                        <span className="capitalize text-slate-600 dark:text-slate-400">{f.water_type}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {f.difficulty_level ? (
                        <span className="capitalize text-slate-600 dark:text-slate-400">{f.difficulty_level}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PublishToggle fishId={f.id} published={f.published} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                      {formatDate(f.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/fish/${f.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <FishDeleteButton fishId={f.id} fishName={f.common_name} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
