"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadPlantImage(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("file") as File;
  const plant_id = formData.get("plant_id") as string;
  const is_primary = formData.get("is_primary") === "true";
  const caption = (formData.get("caption") as string) || null;
  const alt_text = (formData.get("alt_text") as string) || null;

  if (!file || !plant_id) {
    return { error: "Missing file or plant_id" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${plant_id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("plant-images")
    .upload(path, file);

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("plant-images").getPublicUrl(path);

  if (is_primary) {
    await supabase
      .from("plant_images")
      .update({ is_primary: false })
      .eq("plant_id", plant_id);
  }

  const { error: insertError } = await supabase.from("plant_images").insert({
    plant_id,
    image_url: publicUrl,
    alt_text,
    caption,
    is_primary,
    order_index: 0,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/admin/plants/${plant_id}/edit`);
  revalidatePath("/plants");
  revalidatePath("/wiki");
  return { success: true, url: publicUrl };
}

export async function deletePlantImage(
  imageId: string,
  plantId: string,
  imageUrl: string
) {
  const supabase = await createClient();

  try {
    const url = new URL(imageUrl);
    const marker = "/object/public/plant-images/";
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) {
      const storagePath = url.pathname.slice(idx + marker.length);
      await supabase.storage.from("plant-images").remove([storagePath]);
    }
  } catch {
    // If URL parsing fails, still delete the DB record
  }

  await supabase.from("plant_images").delete().eq("id", imageId);

  revalidatePath(`/admin/plants/${plantId}/edit`);
  revalidatePath("/plants");
  revalidatePath("/wiki");
  return { success: true };
}

export async function setPlantImagePrimary(imageId: string, plantId: string) {
  const supabase = await createClient();

  await supabase
    .from("plant_images")
    .update({ is_primary: false })
    .eq("plant_id", plantId);

  await supabase
    .from("plant_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  revalidatePath(`/admin/plants/${plantId}/edit`);
  revalidatePath("/plants");
  revalidatePath("/wiki");
  return { success: true };
}

export async function uploadPlantImageFromUrl(
  imageUrl: string,
  plantId: string,
  caption: string | null,
  altText: string | null,
  isPrimary: boolean,
) {
  const supabase = await createClient();

  let blob: Blob;
  let ext = "jpg";

  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 FishWiki/1.0" },
    });
    if (!response.ok) {
      return { error: `Failed to fetch image (${response.status})` };
    }
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    blob = await response.blob();
  } catch {
    return { error: "Could not fetch image from URL." };
  }

  const path = `${plantId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("plant-images")
    .upload(path, blob, { contentType: blob.type || "image/jpeg" });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("plant-images").getPublicUrl(path);

  if (isPrimary) {
    await supabase
      .from("plant_images")
      .update({ is_primary: false })
      .eq("plant_id", plantId);
  }

  const { error: insertError } = await supabase.from("plant_images").insert({
    plant_id: plantId,
    image_url: publicUrl,
    alt_text: altText || null,
    caption: caption || null,
    is_primary: isPrimary,
    order_index: 0,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath(`/admin/plants/${plantId}/edit`);
  revalidatePath("/plants");
  revalidatePath("/wiki");
  return { success: true, url: publicUrl };
}

export async function replacePlantImageFile(formData: FormData) {
  const supabase = await createClient();

  const imageId = formData.get("image_id") as string;
  const plantId = formData.get("plant_id") as string;
  const oldUrl = formData.get("old_url") as string;
  const file = formData.get("file") as File;

  if (!imageId || !plantId || !file) return { error: "Missing required fields." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${plantId}/${Date.now()}_reframed.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("plant-images")
    .upload(path, file, { contentType: file.type || "image/jpeg" });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("plant-images").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("plant_images")
    .update({ image_url: publicUrl })
    .eq("id", imageId);

  if (updateError) return { error: updateError.message };

  try {
    const url = new URL(oldUrl);
    const marker = "/object/public/plant-images/";
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) {
      const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length));
      await supabase.storage.from("plant-images").remove([storagePath]);
    }
  } catch { /* ignore */ }

  revalidatePath(`/admin/plants/${plantId}/edit`);
  revalidatePath("/plants");
  revalidatePath("/wiki");
  return { success: true, url: publicUrl };
}

export async function updatePlantImageMeta(
  imageId: string,
  plantId: string,
  caption: string,
  altText: string
) {
  const supabase = await createClient();

  await supabase
    .from("plant_images")
    .update({ caption: caption || null, alt_text: altText || null })
    .eq("id", imageId);

  revalidatePath(`/admin/plants/${plantId}/edit`);
  return { success: true };
}
