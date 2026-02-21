"use client";

import { useEffect } from "react";

export interface RecentFish {
  slug: string;
  common_name: string;
  scientific_name: string;
  primary_image: string | null;
  primary_image_alt: string | null;
}

const STORAGE_KEY = "fish_wiki_recent";
const MAX_ITEMS = 10;

export function TrackVisit({ fish }: { fish: RecentFish }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prev: RecentFish[] = stored ? JSON.parse(stored) : [];
      const filtered = prev.filter((f) => f.slug !== fish.slug);
      const next = [fish, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
    }
  }, [fish.slug]);

  return null;
}

export { STORAGE_KEY };
