"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function num(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
}

export async function createWaterProfile(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase.from("water_profiles").insert({
    name,
    description: description || null,
    temp_min: num(formData.get("temp_min")),
    temp_max: num(formData.get("temp_max")),
    ph_min: num(formData.get("ph_min")),
    ph_max: num(formData.get("ph_max")),
    gh_min: num(formData.get("gh_min")),
    gh_max: num(formData.get("gh_max")),
    kh_min: num(formData.get("kh_min")),
    kh_max: num(formData.get("kh_max")),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/water-profiles");
  redirect("/admin/water-profiles");
}

export async function updateWaterProfile(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase
    .from("water_profiles")
    .update({
      name,
      description: description || null,
      temp_min: num(formData.get("temp_min")),
      temp_max: num(formData.get("temp_max")),
      ph_min: num(formData.get("ph_min")),
      ph_max: num(formData.get("ph_max")),
      gh_min: num(formData.get("gh_min")),
      gh_max: num(formData.get("gh_max")),
      kh_min: num(formData.get("kh_min")),
      kh_max: num(formData.get("kh_max")),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/water-profiles");
  return { success: true };
}

export async function deleteWaterProfile(id: string) {
  const supabase = await createClient();
  await supabase.from("water_profiles").delete().eq("id", id);
  revalidatePath("/admin/water-profiles");
  redirect("/admin/water-profiles");
}
