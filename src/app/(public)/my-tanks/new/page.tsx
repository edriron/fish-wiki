"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createTank } from "@/app/actions/tanks";

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
const TEXTAREA =
  "w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none";

export default function NewTankPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [volume, setVolume] = useState("");
  const [tankType, setTankType] = useState("freshwater");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("volume_liters", volume);
    formData.set("tank_type", tankType);

    startTransition(async () => {
      const result = await createTank(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Tank created!");
      router.push(result.tankId ? `/my-tanks/${result.tankId}/edit` : "/my-tanks");
    });
  };

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-8">
      <Link
        href="/my-tanks"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        My Tanks
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">New Tank</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Set up your aquarium — you can add fish and plants after.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Tank Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Living room 200L"
            className={FIELD}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Volume (liters)
            </label>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              min="1"
              placeholder="e.g. 200"
              className={FIELD}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Water Type
            </label>
            <select
              value={tankType}
              onChange={(e) => setTankType(e.target.value)}
              className={FIELD + " cursor-pointer"}
            >
              <option value="freshwater">🌿 Freshwater</option>
              <option value="brackish">💧 Brackish</option>
              <option value="reef">🪸 Reef</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notes about this tank…"
            className={TEXTAREA}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
            ) : (
              <><Save className="h-4 w-4" />Create & Add Fish</>
            )}
          </button>
          <Link
            href="/my-tanks"
            className="rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
