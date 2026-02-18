"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  label?: string;
  confirmMessage?: string;
}

export function DeleteButton({
  onDelete,
  label = "Delete",
  confirmMessage = "Are you sure you want to delete this? This action cannot be undone.",
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Are you sure?</span>
        <button
          onClick={() => {
            startTransition(async () => {
              await onDelete();
            });
          }}
          disabled={isPending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(async () => {
            await onDelete();
          });
        }
      }}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isPending ? "Deleting…" : label}
    </button>
  );
}
