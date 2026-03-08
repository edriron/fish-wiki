"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { toSlug } from "@/lib/slug";

export async function createFish(formData: FormData) {
  const supabase = await createClient();

  const common_name = formData.get("common_name") as string;
  const slug = (formData.get("slug") as string) || toSlug(common_name);
  const scientific_name = formData.get("scientific_name") as string;
  const description = (formData.get("description") as string) || null;
  const origin_region = (formData.get("origin_region") as string) || null;
  const water_type = (formData.get("water_type") as string) || null;
  const difficulty_level = (formData.get("difficulty_level") as string) || null;
  const diet = (formData.get("diet") as string) || null;
  const water_profile_id = (formData.get("water_profile_id") as string) || null;
  const min_tank_liters_raw = formData.get("min_tank_liters") as string;
  const min_tank_liters = min_tank_liters_raw ? Number(min_tank_liters_raw) : null;
  const max_size_cm_raw = formData.get("max_size_cm") as string;
  const max_size_cm = max_size_cm_raw ? Number(max_size_cm_raw) : null;
  const published = formData.get("published") === "true";
  const labelIds = formData.getAll("label_ids") as string[];

  const { data: fish, error } = await supabase
    .from("fish_species")
    .insert({
      common_name,
      slug,
      scientific_name,
      description: description || null,
      origin_region: origin_region || null,
      water_type: water_type || null,
      difficulty_level: difficulty_level || null,
      diet: diet || null,
      water_profile_id: water_profile_id || null,
      min_tank_liters,
      max_size_cm,
      published,
    })
    .select()
    .single();

  if (error || !fish) {
    if (error?.code === "23505") {
      return { error: "A fish species with this name (or slug) already exists." };
    }
    return { error: error?.message ?? "Failed to create fish" };
  }

  if (labelIds.length > 0) {
    await supabase
      .from("fish_labels")
      .insert(labelIds.map((lid) => ({ fish_id: fish.id, label_id: lid })));
  }

  revalidatePath("/admin/fish");
  revalidatePath("/wiki");
  return { success: true, redirectTo: "/admin/fish", fishId: fish.id };
}

export async function updateFish(id: string, formData: FormData) {
  const supabase = await createClient();

  const common_name = formData.get("common_name") as string;
  const slug = formData.get("slug") as string;
  const scientific_name = formData.get("scientific_name") as string;
  const description = (formData.get("description") as string) || null;
  const origin_region = (formData.get("origin_region") as string) || null;
  const water_type = (formData.get("water_type") as string) || null;
  const difficulty_level = (formData.get("difficulty_level") as string) || null;
  const diet = (formData.get("diet") as string) || null;
  const water_profile_id = (formData.get("water_profile_id") as string) || null;
  const min_tank_liters_raw = formData.get("min_tank_liters") as string;
  const min_tank_liters = min_tank_liters_raw ? Number(min_tank_liters_raw) : null;
  const max_size_cm_raw = formData.get("max_size_cm") as string;
  const max_size_cm = max_size_cm_raw ? Number(max_size_cm_raw) : null;
  const published = formData.get("published") === "true";
  const labelIds = formData.getAll("label_ids") as string[];

  const { error } = await supabase
    .from("fish_species")
    .update({
      common_name,
      slug,
      scientific_name,
      description: description || null,
      origin_region: origin_region || null,
      water_type: water_type || null,
      difficulty_level: difficulty_level || null,
      diet: diet || null,
      water_profile_id: water_profile_id || null,
      min_tank_liters,
      max_size_cm,
      published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Sync labels: delete all then re-insert
  await supabase.from("fish_labels").delete().eq("fish_id", id);
  if (labelIds.length > 0) {
    await supabase
      .from("fish_labels")
      .insert(labelIds.map((lid) => ({ fish_id: id, label_id: lid })));
  }

  revalidatePath("/admin/fish");
  revalidatePath(`/wiki/${slug}`);
  revalidatePath("/wiki");
  return { success: true, redirectTo: "/admin/fish" };
}

export async function deleteFish(id: string) {
  const supabase = await createClient();
  await supabase.from("fish_species").delete().eq("id", id);
  revalidatePath("/admin/fish");
  revalidatePath("/wiki");
  return { success: true, redirectTo: "/admin/fish" };
}

export async function toggleFishPublished(id: string, published: boolean) {
  const supabase = await createClient();
  await supabase.from("fish_species").update({ published }).eq("id", id);
  revalidatePath("/admin/fish");
  revalidatePath("/wiki");
  return { success: true };
}
