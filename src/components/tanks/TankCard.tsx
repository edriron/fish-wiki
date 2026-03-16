import Link from "next/link";
import { Fish, Leaf, Droplets, Pencil } from "lucide-react";
import type { TankWithCounts } from "@/types/tank";

export function TankCard({ tank }: { tank: TankWithCounts }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:shadow-md hover:border-teal-200 dark:hover:border-teal-700 transition-all duration-200 flex flex-col">
      {/* Color bar */}
      <div className="h-1.5 bg-gradient-to-r from-teal-400 to-cyan-500" />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug">
            {tank.name}
          </h3>
          {tank.volume_liters && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-2 py-0.5">
              <Droplets className="h-3 w-3" />
              {tank.volume_liters}L
            </span>
          )}
        </div>

        {tank.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
            {tank.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
          <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <Fish className="h-4 w-4 text-blue-400" />
            {tank.fishSpeciesCount} species
          </span>
          <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <Leaf className="h-4 w-4 text-green-400" />
            {tank.plantSpeciesCount} plants
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 flex gap-2">
        <Link
          href={`/my-tanks/${tank.id}`}
          className="flex-1 rounded-xl bg-teal-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          View Tank
        </Link>
        <Link
          href={`/my-tanks/${tank.id}/edit`}
          className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
