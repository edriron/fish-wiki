"use client";

import { useTransition } from "react";
import { Globe, GlobeLock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleFishPublished } from "@/app/actions/fish";
import { cn } from "@/lib/utils";

interface PublishToggleProps {
  fishId: string;
  published: boolean;
}

export function PublishToggle({ fishId, published }: PublishToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleFishPublished(fishId, !published);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        published
          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
      )}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : published ? (
        <Globe className="h-3 w-3" />
      ) : (
        <GlobeLock className="h-3 w-3" />
      )}
      {published ? "Published" : "Draft"}
    </button>
  );
}
