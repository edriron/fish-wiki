"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createLabel, updateLabel } from "@/app/actions/labels";

interface Label {
  id: string;
  name: string;
  color: string | null;
  parent_id: string | null;
  is_grouping: boolean;
}

interface LabelFormProps {
  label?: Label;
  allLabels: Label[];
}

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
const SELECT =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors cursor-pointer";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
  "#0ea5e9", // sky
];

// Build a flat list in tree order with depth info for the parent selector
function buildTreeOptions(
  labels: Label[],
  excludeId?: string,
): { id: string; name: string; depth: number }[] {
  // Collect all descendant IDs of excludeId to prevent circular parenting
  const excluded = new Set<string>();
  if (excludeId) {
    excluded.add(excludeId);
    let changed = true;
    while (changed) {
      changed = false;
      for (const l of labels) {
        if (l.parent_id && excluded.has(l.parent_id) && !excluded.has(l.id)) {
          excluded.add(l.id);
          changed = true;
        }
      }
    }
  }

  const eligible = labels.filter((l) => !excluded.has(l.id));
  const result: { id: string; name: string; depth: number }[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const l of eligible) {
      if (l.parent_id === parentId) {
        result.push({ id: l.id, name: l.name, depth });
        walk(l.id, depth + 1);
      }
    }
  }
  walk(null, 0);
  return result;
}

export function LabelForm({ label, allLabels }: LabelFormProps) {
  const isEdit = Boolean(label);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState(label?.color ?? "");
  const [parentId, setParentId] = useState(label?.parent_id ?? "");
  const [isGrouping, setIsGrouping] = useState(label?.is_grouping ?? true);

  const parentOptions = buildTreeOptions(allLabels, label?.id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("color", color);
    formData.set("parent_id", parentId);
    formData.set("is_grouping", String(isGrouping));

    startTransition(async () => {
      if (isEdit && label) {
        const result = await updateLabel(label.id, formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (!result?.redirectTo) {
          setError("Unexpected error: missing redirect.");
          return;
        }
        toast.success("Label updated.");
        router.push(result.redirectTo);
      } else {
        const result = await createLabel(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (!result?.redirectTo) {
          setError("Unexpected error: missing redirect.");
          return;
        }
        toast.success("Label created.");
        router.push(result.redirectTo);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Label Details
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. African Cichlid, Schooling Fish"
              className={FIELD}
            />
          </div>

          {/* Parent Label */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Parent Label
              <span className="ml-2 font-normal text-slate-400 dark:text-slate-500 text-xs">
                (optional — for hierarchy)
              </span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={SELECT}
            >
              <option value="">— None (root label) —</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {"  ".repeat(opt.depth)}
                  {opt.depth > 0 ? "└ " : ""}
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grouping toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Use as grouping category
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                On — fish are grouped by this label in tank view (e.g. Cichlid, Catfish).
                Off — shown as a badge instead (e.g. Aggressive, Community Safe).
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isGrouping}
              onClick={() => setIsGrouping((v) => !v)}
              className={`relative ml-4 shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isGrouping ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isGrouping ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Color
              <span className="ml-2 font-normal text-slate-400 dark:text-slate-500 text-xs">
                (used as a tag accent color)
              </span>
            </label>

            {/* Preset swatches */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  title={c}
                  className="h-7 w-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#0f172a" : "transparent",
                    outline: color === c ? "2px solid white" : "none",
                    outlineOffset: "-4px",
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => setColor("")}
                title="No color"
                className="h-7 w-7 rounded-full border-2 border-slate-200 bg-white text-slate-400 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Custom hex */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color || "#6b7280"}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 dark:border-slate-600 p-0.5"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#rrggbb"
                className="h-9 w-36 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {color && (
                <span
                  className="inline-block rounded-full border px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                    borderColor: `${color}40`,
                  }}
                >
                  {name || "Preview"}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Save Changes" : "Create Label"}
            </>
          )}
        </button>
        <a
          href="/admin/labels"
          className="rounded-lg border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
