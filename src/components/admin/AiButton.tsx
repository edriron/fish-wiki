"use client";

import { Sparkles } from "lucide-react";

interface AiButtonProps {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
}

export function AiButton({
  onClick,
  label = "Auto-fill with AI",
  disabled = false,
}: AiButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      alert("AI integration coming soon.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
