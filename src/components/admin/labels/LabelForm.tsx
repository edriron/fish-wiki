"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { AiButton } from "@/components/admin/AiButton";
import { createLabel, updateLabel } from "@/app/actions/labels";

interface Label {
  id: string;
  name: string;
  color: string | null;
}

interface LabelFormProps {
  label?: Label;
}

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";

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

export function LabelForm({ label }: LabelFormProps) {
  const isEdit = Boolean(label);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState(label?.color ?? "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("color", color);

    startTransition(async () => {
      if (isEdit && label) {
        const result = await updateLabel(label.id, formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
      } else {
        const result = await createLabel(formData);
        if (result?.error) {
          setError(result.error);
        }
        // redirect on success happens server-side
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
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Saved successfully.
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Label Details
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Name <span className="text-red-500">*</span>
              </label>
              <AiButton label="Auto-fill with AI" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. African Cichlid, Schooling Fish"
              className={FIELD}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Color
              <span className="ml-2 font-normal text-slate-400 text-xs">
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
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#rrggbb"
                className="h-9 w-36 rounded-md border border-slate-200 bg-white px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
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
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
