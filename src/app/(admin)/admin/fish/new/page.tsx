import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FishForm } from "@/components/admin/fish/FishForm";

export default async function NewFishPage() {
  const supabase = await createClient();

  const [{ data: waterProfiles }, { data: labels }] = await Promise.all([
    supabase.from("water_profiles").select("*").order("name"),
    supabase.from("labels").select("id, name, color").order("name"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/fish"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Fish Species
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Fish Species</h1>
        <p className="mt-1 text-slate-500">
          Fill in the details to add a new species to the wiki.
        </p>
      </div>

      <FishForm
        waterProfiles={waterProfiles ?? []}
        allLabels={labels ?? []}
      />
    </div>
  );
}
