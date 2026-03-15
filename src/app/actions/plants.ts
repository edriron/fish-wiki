"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { toSlug } from "@/lib/slug";

export async function createPlant(formData: FormData) {
  const supabase = await createClient();

  const common_name = formData.get("common_name") as string;
  const slug = (formData.get("slug") as string) || toSlug(common_name);
  const scientific_name = formData.get("scientific_name") as string;
  const type = (formData.get("type") as string) || "plant";
  const description = (formData.get("description") as string) || null;
  const light_requirement = (formData.get("light_requirement") as string) || null;
  const co2_requirement = (formData.get("co2_requirement") as string) || null;
  const difficulty = (formData.get("difficulty") as string) || null;
  const substrate_raw = formData.get("substrate") as string;
  const substrate = substrate_raw === "true" ? true : substrate_raw === "false" ? false : null;
  const growth_rate = (formData.get("growth_rate") as string) || null;
  const temp_min_raw = formData.get("temp_min") as string;
  const temp_min = temp_min_raw ? Number(temp_min_raw) : null;
  const temp_max_raw = formData.get("temp_max") as string;
  const temp_max = temp_max_raw ? Number(temp_max_raw) : null;
  const water_type = (formData.get("water_type") as string) || null;
  const origin_region = (formData.get("origin_region") as string) || null;
  const primary_image_url = (formData.get("primary_image_url") as string) || null;
  const published = formData.get("published") === "true";

  const { data: plant, error } = await supabase
    .from("plant_species")
    .insert({
      common_name,
      slug,
      scientific_name,
      type,
      description,
      light_requirement,
      co2_requirement,
      difficulty,
      substrate,
      growth_rate,
      temp_min,
      temp_max,
      water_type,
      origin_region,
      primary_image_url,
      published,
    })
    .select()
    .single();

  if (error || !plant) {
    if (error?.code === "23505") {
      return { error: "A plant/coral with this name or slug already exists." };
    }
    return { error: error?.message ?? "Failed to create plant." };
  }

  revalidatePath("/admin/plants");
  revalidatePath("/plants");
  return { success: true, redirectTo: "/admin/plants", plantId: plant.id };
}

export async function updatePlant(id: string, formData: FormData) {
  const supabase = await createClient();

  const common_name = formData.get("common_name") as string;
  const slug = formData.get("slug") as string;
  const scientific_name = formData.get("scientific_name") as string;
  const type = (formData.get("type") as string) || "plant";
  const description = (formData.get("description") as string) || null;
  const light_requirement = (formData.get("light_requirement") as string) || null;
  const co2_requirement = (formData.get("co2_requirement") as string) || null;
  const difficulty = (formData.get("difficulty") as string) || null;
  const substrate_raw = formData.get("substrate") as string;
  const substrate = substrate_raw === "true" ? true : substrate_raw === "false" ? false : null;
  const growth_rate = (formData.get("growth_rate") as string) || null;
  const temp_min_raw = formData.get("temp_min") as string;
  const temp_min = temp_min_raw ? Number(temp_min_raw) : null;
  const temp_max_raw = formData.get("temp_max") as string;
  const temp_max = temp_max_raw ? Number(temp_max_raw) : null;
  const water_type = (formData.get("water_type") as string) || null;
  const origin_region = (formData.get("origin_region") as string) || null;
  const primary_image_url = (formData.get("primary_image_url") as string) || null;
  const published = formData.get("published") === "true";

  const { error } = await supabase
    .from("plant_species")
    .update({
      common_name,
      slug,
      scientific_name,
      type,
      description,
      light_requirement,
      co2_requirement,
      difficulty,
      substrate,
      growth_rate,
      temp_min,
      temp_max,
      water_type,
      origin_region,
      primary_image_url,
      published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/plants");
  revalidatePath(`/plants/${slug}`);
  revalidatePath("/plants");
  return { success: true, redirectTo: "/admin/plants" };
}

export async function deletePlant(id: string) {
  const supabase = await createClient();
  await supabase.from("plant_species").delete().eq("id", id);
  revalidatePath("/admin/plants");
  revalidatePath("/plants");
  return { success: true };
}

export async function togglePlantPublished(id: string, published: boolean) {
  const supabase = await createClient();
  await supabase.from("plant_species").update({ published }).eq("id", id);
  revalidatePath("/admin/plants");
  revalidatePath("/plants");
  return { success: true };
}
