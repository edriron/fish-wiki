"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createVariant(formData: FormData) {
  const supabase = await createClient();

  const fish_id = formData.get("fish_id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const order_index = Number(formData.get("order_index") ?? 0);

  const { data, error } = await supabase
    .from("fish_variants")
    .insert({ fish_id, name, description, order_index })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/fish/${fish_id}/edit`);
  return { success: true, id: data.id };
}

export async function updateVariant(
  variantId: string,
  fishId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase
    .from("fish_variants")
    .update({ name, description })
    .eq("id", variantId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/fish/${fishId}/edit`);
  return { success: true };
}

export async function deleteVariant(variantId: string, fishId: string) {
  const supabase = await createClient();

  // Cascade: delete variant images
  await supabase.from("fish_images").delete().eq("variant_id", variantId);
  // Delete variant
  await supabase.from("fish_variants").delete().eq("id", variantId);

  revalidatePath(`/admin/fish/${fishId}/edit`);
  return { success: true };
}
