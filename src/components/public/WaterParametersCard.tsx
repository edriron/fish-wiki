import { Thermometer, FlaskConical, Waves, TestTube, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface WaterParametersCardProps {
  temp_min?: number | null;
  temp_max?: number | null;
  ph_min?: number | null;
  ph_max?: number | null;
  gh_min?: number | null;
  gh_max?: number | null;
  kh_min?: number | null;
  kh_max?: number | null;
  min_tank_liters?: number | null;
  profile_name?: string | null;
}

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min}–${max}`;
  if (min != null) return `≥ ${min}`;
  return `≤ ${max}`;
}

interface ParamRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  first?: boolean;
}

function ParamRow({ icon, label, value, unit, first = false }: ParamRowProps) {
  return (
    <>
      {!first && <Separator />}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
            {icon}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
        </div>
        <p className="text-sm font-semibold text-slate-900 tabular-nums shrink-0 dark:text-slate-100">
          {value}
          {unit && (
            <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
              {unit}
            </span>
          )}
        </p>
      </div>
    </>
  );
}

export function WaterParametersCard({
  temp_min,
  temp_max,
  ph_min,
  ph_max,
  gh_min,
  gh_max,
  kh_min,
  kh_max,
  min_tank_liters,
  profile_name,
}: WaterParametersCardProps) {
  const temp = formatRange(temp_min, temp_max);
  const ph = formatRange(ph_min, ph_max);
  const gh = formatRange(gh_min, gh_max);
  const kh = formatRange(kh_min, kh_max);

  const hasAnyParam = temp || ph || gh || kh || min_tank_liters != null;

  if (!hasAnyParam) return null;

  const rows = [
    temp && {
      icon: <Thermometer className="h-4 w-4 text-orange-400" />,
      label: "Temperature",
      value: temp,
      unit: "°C",
    },
    ph && {
      icon: <FlaskConical className="h-4 w-4 text-violet-400" />,
      label: "pH",
      value: ph,
    },
    gh && {
      icon: <Waves className="h-4 w-4 text-blue-400" />,
      label: "GH Hardness",
      value: gh,
      unit: "dGH",
    },
    kh && {
      icon: <TestTube className="h-4 w-4 text-teal-400" />,
      label: "KH Alkalinity",
      value: kh,
      unit: "dKH",
    },
    min_tank_liters != null && {
      icon: <Box className="h-4 w-4 text-slate-400" />,
      label: "Min Tank Size",
      value: `${min_tank_liters}`,
      unit: "L",
    },
  ].filter(Boolean) as Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    unit?: string;
  }>;

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Water Requirements
          </CardTitle>
          {profile_name && (
            <span className="rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400">
              {profile_name}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, i) => (
          <ParamRow key={row.label} {...row} first={i === 0} />
        ))}
      </CardContent>
    </Card>
  );
}
