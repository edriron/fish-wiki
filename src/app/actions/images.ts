"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadImage(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("file") as File;
  const fish_id = formData.get("fish_id") as string;
  const is_primary = formData.get("is_primary") === "true";
  const caption = (formData.get("caption") as string) || null;
  const alt_text = (formData.get("alt_text") as string) || null;
  const variant_id = (formData.get("variant_id") as string) || null;

  if (!file || !fish_id) {
    return { error: "Missing file or fish_id" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${fish_id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("fish-images")
    .upload(path, file);

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("fish-images").getPublicUrl(path);

  // If setting as primary, unset other base images first
  if (is_primary) {
    await supabase
      .from("fish_images")
      .update({ is_primary: false })
      .eq("fish_id", fish_id)
      .is("variant_id", null);
  }

  const { error: insertError } = await supabase.from("fish_images").insert({
    fish_id,
    image_url: publicUrl,
    alt_text,
    caption,
    variant_id,
    is_primary: is_primary && !variant_id,
    order_index: 0,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/admin/fish/${fish_id}/edit`);
  revalidatePath("/wiki");
  return { success: true, url: publicUrl };
}

export async function deleteImage(
  imageId: string,
  fishId: string,
  imageUrl: string
) {
  const supabase = await createClient();

  // Extract storage path from URL
  try {
    const url = new URL(imageUrl);
    const marker = "/object/public/fish-images/";
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) {
      const storagePath = url.pathname.slice(idx + marker.length);
      await supabase.storage.from("fish-images").remove([storagePath]);
    }
  } catch {
    // If URL parsing fails, still delete the DB record
  }

  await supabase.from("fish_images").delete().eq("id", imageId);

  revalidatePath(`/admin/fish/${fishId}/edit`);
  revalidatePath("/wiki");
  return { success: true };
}

export async function setImagePrimary(imageId: string, fishId: string) {
  const supabase = await createClient();

  // Unset all primary flags for base images of this fish
  await supabase
    .from("fish_images")
    .update({ is_primary: false })
    .eq("fish_id", fishId)
    .is("variant_id", null);

  // Set this image as primary
  await supabase
    .from("fish_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  revalidatePath(`/admin/fish/${fishId}/edit`);
  revalidatePath("/wiki");
  return { success: true };
}

export async function updateImageMeta(
  imageId: string,
  fishId: string,
  caption: string,
  altText: string
) {
  const supabase = await createClient();

  await supabase
    .from("fish_images")
    .update({ caption: caption || null, alt_text: altText || null })
    .eq("id", imageId);

  revalidatePath(`/admin/fish/${fishId}/edit`);
  return { success: true };
}
