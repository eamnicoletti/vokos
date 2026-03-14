"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  removeAvatar: z.boolean().default(false)
});

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForFile(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function updateMyProfileAction(formData: FormData) {
  const input = updateProfileSchema.parse({
    fullName: formData.get("fullName"),
    removeAvatar: formData.get("removeAvatar") === "true"
  });
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const currentMetadata =
    user.user_metadata && typeof user.user_metadata === "object" ? { ...user.user_metadata } : {};
  const avatarFile = formData.get("avatarFile");
  const hasAvatarFile = avatarFile instanceof File && avatarFile.size > 0;
  const currentAvatarPath = typeof currentMetadata.avatar_path === "string" ? currentMetadata.avatar_path : null;
  let nextAvatarUrl = typeof currentMetadata.avatar_url === "string" ? currentMetadata.avatar_url : null;
  let nextAvatarPath = currentAvatarPath;
  let uploadedAvatarPath: string | null = null;

  if (hasAvatarFile) {
    if (!ALLOWED_MIME_TYPES.has(avatarFile.type)) {
      throw new Error("Envie uma imagem JPG, PNG, WEBP ou GIF.");
    }

    if (avatarFile.size > MAX_AVATAR_SIZE) {
      throw new Error("A imagem deve ter no máximo 2 MB.");
    }

    const uploadPath = `${user.id}/${randomUUID()}.${extensionForFile(avatarFile)}`;
    const fileBytes = new Uint8Array(await avatarFile.arrayBuffer());
    const { error: uploadError } = await admin.storage.from(AVATAR_BUCKET).upload(uploadPath, fileBytes, {
      contentType: avatarFile.type,
      upsert: false
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(uploadPath);
    uploadedAvatarPath = uploadPath;
    nextAvatarPath = uploadPath;
    nextAvatarUrl = publicUrlData.publicUrl;
  } else if (input.removeAvatar) {
    nextAvatarPath = null;
    nextAvatarUrl = null;
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...currentMetadata,
      full_name: input.fullName,
      name: input.fullName,
      avatar_url: nextAvatarUrl,
      avatar_path: nextAvatarPath
    }
  });

  if (updateError) {
    if (uploadedAvatarPath) {
      await admin.storage.from(AVATAR_BUCKET).remove([uploadedAvatarPath]);
    }

    throw new Error(updateError.message);
  }

  if (currentAvatarPath && currentAvatarPath !== nextAvatarPath) {
    await admin.storage.from(AVATAR_BUCKET).remove([currentAvatarPath]);
  }

  revalidatePath("/conta/profile");
  revalidatePath("/", "layout");

  return { ok: true };
}
