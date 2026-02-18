"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { FishLabel } from "@/types/fish";

interface LabelFilterProps {
  labels: FishLabel[];
}

export function LabelFilter({ labels }: LabelFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selectedLabel = searchParams.get("label");

  const setLabel = (labelId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (labelId) {
      params.set("label", labelId);
    } else {
      params.delete("label");
    }
    startTransition(() => {
      router.push(`/wiki?${params.toString()}`);
    });
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-3">
      <button
        onClick={() => setLabel(null)}
        disabled={isPending}
        className={cn(
          "shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
          !selectedLabel
            ? "border-teal-600 bg-teal-600 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400"
        )}
      >
        All Species
      </button>

      {labels.map((label) => (
        <button
          key={label.id}
          onClick={() => setLabel(selectedLabel === label.id ? null : label.id)}
          disabled={isPending}
          className={cn(
            "shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
            selectedLabel === label.id
              ? "border-teal-600 bg-teal-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:text-teal-400"
          )}
          style={
            selectedLabel === label.id && label.color
              ? { backgroundColor: label.color, borderColor: label.color }
              : label.color && selectedLabel !== label.id
              ? { borderColor: `${label.color}50`, color: label.color }
              : undefined
          }
        >
          {label.name}
        </button>
      ))}
    </div>
  );
}
