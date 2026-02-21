"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Fish } from "lucide-react";
import { STORAGE_KEY, type RecentFish } from "./TrackVisit";

export function RecentlyVisited({ currentSlug }: { currentSlug?: string }) {
  const [recent, setRecent] = useState<RecentFish[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all: RecentFish[] = JSON.parse(stored);
        setRecent(currentSlug ? all.filter((f) => f.slug !== currentSlug) : all);
      }
    } catch {
      // localStorage unavailable
    }
  }, [currentSlug]);

  if (!mounted || recent.length === 0) return null;

  return (
    <section className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Recently Visited
      </h2>

      {/* Scrollable horizontal strip */}
      <div className="flex gap-3 overflow-x-auto pt-1 pb-2 -mx-1 px-1 scrollbar-thin">
        {recent.map((fish) => (
          <Link
            key={fish.slug}
            href={`/wiki/${fish.slug}`}
            className="group flex-none w-36 sm:w-44"
          >
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-teal-200 dark:group-hover:border-teal-700">
              {/* Image */}
              <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                {fish.primary_image ? (
                  <Image
                    src={fish.primary_image}
                    alt={fish.primary_image_alt ?? fish.common_name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="176px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Fish className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="p-2.5">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-snug">
                  {fish.common_name}
                </p>
                <p className="text-xs italic text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {fish.scientific_name}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
