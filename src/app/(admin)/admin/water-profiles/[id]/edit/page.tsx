import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WaterProfileForm } from "@/components/admin/water-profiles/WaterProfileForm";
import { WaterProfileDeleteButton } from "@/components/admin/water-profiles/WaterProfileDeleteButton";

export default async function EditWaterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("water_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/water-profiles"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Water Profiles
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Water Profile</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{profile.name}</p>
          </div>
          <WaterProfileDeleteButton profileId={profile.id} profileName={profile.name} />
        </div>
      </div>

      <WaterProfileForm profile={profile} />
    </div>
  );
}
