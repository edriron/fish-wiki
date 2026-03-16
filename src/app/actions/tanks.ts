"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTank(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/my-tanks/login");

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const volume_raw = formData.get("volume_liters") as string;
  const volume_liters = volume_raw ? Number(volume_raw) : null;
  const tank_type = (formData.get("tank_type") as string) || "freshwater";

  const { data: tank, error } = await supabase
    .from("tanks")
    .insert({ user_id: user.id, name, description, volume_liters, tank_type })
    .select()
    .single();

  if (error || !tank) return { error: error?.message ?? "Failed to create tank." };

  revalidatePath("/my-tanks");
  return { tankId: tank.id as string };
}

export async function updateTank(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const volume_raw = formData.get("volume_liters") as string;
  const volume_liters = volume_raw ? Number(volume_raw) : null;
  const tank_type = (formData.get("tank_type") as string) || "freshwater";

  const { error } = await supabase
    .from("tanks")
    .update({ name, description, volume_liters, tank_type, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/my-tanks");
  revalidatePath(`/my-tanks/${id}`);
  return { success: true };
}

export async function deleteTank(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  await supabase.from("tanks").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/my-tanks");
  return { success: true };
}

export async function saveTankContents(
  tankId: string,
  fish: { fishId: string; quantity: number; male: number; female: number }[],
  plants: { plantId: string; quantity: number }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Verify ownership
  const { data: tank } = await supabase
    .from("tanks")
    .select("id")
    .eq("id", tankId)
    .eq("user_id", user.id)
    .single();

  if (!tank) return { error: "Tank not found." };

  // Replace fish
  await supabase.from("tank_fish").delete().eq("tank_id", tankId);
  if (fish.length > 0) {
    const { error } = await supabase.from("tank_fish").insert(
      fish.map((f) => ({
        tank_id: tankId,
        fish_id: f.fishId,
        quantity: f.quantity,
        quantity_male: f.male,
        quantity_female: f.female,
      })),
    );
    if (error) return { error: error.message };
  }

  // Replace plants
  await supabase.from("tank_plants").delete().eq("tank_id", tankId);
  if (plants.length > 0) {
    const { error } = await supabase.from("tank_plants").insert(
      plants.map((p) => ({ tank_id: tankId, plant_id: p.plantId, quantity: p.quantity })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath(`/my-tanks/${tankId}`);
  revalidatePath(`/my-tanks/${tankId}/edit`);
  return { success: true };
}
