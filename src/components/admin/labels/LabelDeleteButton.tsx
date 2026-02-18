"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteLabel } from "@/app/actions/labels";

interface LabelDeleteButtonProps {
  labelId: string;
  labelName: string;
}

export function LabelDeleteButton({ labelId, labelName }: LabelDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete label "${labelName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteLabel(labelId);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
