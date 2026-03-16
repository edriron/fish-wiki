"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  createWaterProfile,
  updateWaterProfile,
} from "@/app/actions/water-profiles";
import type { WaterProfile } from "@/types/fish";

interface WaterProfileFormProps {
  profile?: WaterProfile;
}

const FIELD =
  "h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
const TEXTAREA =
  "w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none";

function RangeRow({
  label,
  nameMin,
  nameMax,
  unit,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  step = "0.1",
  min = "0",
}: {
  label: string;
  nameMin: string;
  nameMax: string;
  unit: string;
  valueMin: string;
  valueMax: string;
  onChangeMin: (v: string) => void;
  onChangeMax: (v: string) => void;
  step?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        <span className="ml-1 font-normal text-slate-400 dark:text-slate-500 text-xs">
          ({unit})
        </span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={nameMin}
          value={valueMin}
          onChange={(e) => onChangeMin(e.target.value)}
          placeholder="Min"
          step={step}
          min={min}
          className={FIELD}
        />
        <span className="text-slate-400 dark:text-slate-500 text-sm shrink-0">
          to
        </span>
        <input
          type="number"
          name={nameMax}
          value={valueMax}
          onChange={(e) => onChangeMax(e.target.value)}
          placeholder="Max"
          step={step}
          min={min}
          className={FIELD}
        />
      </div>
    </div>
  );
}

export function WaterProfileForm({ profile }: WaterProfileFormProps) {
  const isEdit = Boolean(profile);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [tempMin, setTempMin] = useState(profile?.temp_min?.toString() ?? "");
  const [tempMax, setTempMax] = useState(profile?.temp_max?.toString() ?? "");
  const [phMin, setPhMin] = useState(profile?.ph_min?.toString() ?? "");
  const [phMax, setPhMax] = useState(profile?.ph_max?.toString() ?? "");
  const [ghMin, setGhMin] = useState(profile?.gh_min?.toString() ?? "");
  const [ghMax, setGhMax] = useState(profile?.gh_max?.toString() ?? "");
  const [khMin, setKhMin] = useState(profile?.kh_min?.toString() ?? "");
  const [khMax, setKhMax] = useState(profile?.kh_max?.toString() ?? "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("temp_min", tempMin);
    formData.set("temp_max", tempMax);
    formData.set("ph_min", phMin);
    formData.set("ph_max", phMax);
    formData.set("gh_min", ghMin);
    formData.set("gh_max", ghMax);
    formData.set("kh_min", khMin);
    formData.set("kh_max", khMax);

    startTransition(async () => {
      if (isEdit && profile) {
        const result = await updateWaterProfile(profile.id, formData);
        if (result?.error) {
          setError(result.error);
        }
        if (!result?.redirectTo) {
          setError("Unexpected error: missing redirect.");
          return;
        }

        toast.success("Water profile updated.");
        router.push(result.redirectTo);
        // else {
        //   toast.success("Water profile updated.");
        //   router.push(result.redirectTo);
        // }
      } else {
        const result = await createWaterProfile(formData);
        if (result?.error) {
          setError(result.error);
        }
        if (!result?.redirectTo) {
          setError("Unexpected error: missing redirect.");
          return;
        }

        toast.success("Water profile created.");
        router.push(result.redirectTo);
        // else {
        //   toast.success("Water profile created.");
        //   router.push(result.redirectTo);
        // }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {/* Basic Info */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Profile Details
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Profile Name <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Malawi Lake, Tanganyika Lake, Amazon River"
              className={FIELD}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this water profile…"
              className={TEXTAREA}
            />
          </div>
        </div>
      </section>

      {/* Water Parameters */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Water Parameters
          </h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <RangeRow
            label="Temperature"
            nameMin="temp_min"
            nameMax="temp_max"
            unit="°C"
            valueMin={tempMin}
            valueMax={tempMax}
            onChangeMin={setTempMin}
            onChangeMax={setTempMax}
            step="0.5"
          />
          <RangeRow
            label="pH"
            nameMin="ph_min"
            nameMax="ph_max"
            unit="pH"
            valueMin={phMin}
            valueMax={phMax}
            onChangeMin={setPhMin}
            onChangeMax={setPhMax}
            step="0.1"
          />
          <RangeRow
            label="General Hardness"
            nameMin="gh_min"
            nameMax="gh_max"
            unit="dGH"
            valueMin={ghMin}
            valueMax={ghMax}
            onChangeMin={setGhMin}
            onChangeMax={setGhMax}
            step="1"
          />
          <RangeRow
            label="Carbonate Hardness"
            nameMin="kh_min"
            nameMax="kh_max"
            unit="dKH"
            valueMin={khMin}
            valueMax={khMax}
            onChangeMin={setKhMin}
            onChangeMax={setKhMax}
            step="1"
          />
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
              {isEdit ? "Save Changes" : "Create Profile"}
            </>
          )}
        </button>
        <a
          href="/admin/water-profiles"
          className="rounded-lg border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
