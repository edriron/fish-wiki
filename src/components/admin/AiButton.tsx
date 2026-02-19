"use client";

import { Sparkles, Loader2 } from "lucide-react";

interface AiButtonProps {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function AiButton({
  onClick,
  label = "Auto-fill with AI",
  disabled = false,
  loading = false,
}: AiButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}
