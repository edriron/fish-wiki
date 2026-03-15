"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

const dietInfo: Record<string, string> = {
  carnivore:
    "Primarily eats other animals — insects, crustaceans, worms, or live/frozen meaty foods. Requires protein-rich diet.",
  omnivore:
    "Eats both plant matter and animal prey. Accepts a wide variety of foods including flakes, pellets, and live/frozen foods.",
  herbivore:
    "Primarily eats plant matter, algae, and vegetation. Needs spirulina, blanched vegetables, and plant-based foods.",
  "algae eater":
    "Grazes on algae and biofilm. Essential for tank maintenance. Supplement with algae wafers and vegetables.",
};

export function DietTooltip({ diet }: { diet: string }) {
  const [show, setShow] = useState(false);
  const info = dietInfo[diet.toLowerCase()];
  if (!info) return null;

  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label={`What does ${diet} eat?`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-20 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 shadow-lg">
          {info}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 block w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white dark:border-t-slate-800" />
        </div>
      )}
    </span>
  );
}
