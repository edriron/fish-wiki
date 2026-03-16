"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLabel(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || null;
  const parent_id = (formData.get("parent_id") as string) || null;
  const is_grouping = formData.get("is_grouping") === "true";

  const { error } = await supabase
    .from("labels")
    .insert({ name, color: color || null, parent_id, is_grouping });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/labels");
  revalidatePath("/wiki");
  return { success: true, redirectTo: "/admin/labels" };
}

export async function updateLabel(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || null;
  const parent_id = (formData.get("parent_id") as string) || null;
  const is_grouping = formData.get("is_grouping") === "true";

  const { error } = await supabase
    .from("labels")
    .update({ name, color: color || null, parent_id, is_grouping })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/labels");
  revalidatePath("/wiki");
  return { success: true, redirectTo: "/admin/labels" };
}

export async function deleteLabel(id: string) {
  const supabase = await createClient();
  await supabase.from("labels").delete().eq("id", id);
  revalidatePath("/admin/labels");
  revalidatePath("/wiki");
  return { success: true, redirectTo: "/admin/labels" };
}
