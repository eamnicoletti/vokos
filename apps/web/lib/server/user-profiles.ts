import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { profileFromAuthUser, type UserProfileSummary } from "@/lib/user-profile";

export async function getUserProfilesByIds(userIds: Array<string | null | undefined>) {
  const uniqueIds = [...new Set(userIds.filter((userId): userId is string => Boolean(userId)))];
  const profiles = new Map<string, UserProfileSummary>();

  if (uniqueIds.length === 0) {
    return profiles;
  }

  const admin = createAdminSupabaseClient();
  const results = await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data, error } = await admin.auth.admin.getUserById(userId);

      if (error || !data.user) {
        return null;
      }

      return profileFromAuthUser(data.user);
    })
  );

  for (const profile of results) {
    if (!profile?.id) {
      continue;
    }

    profiles.set(profile.id, profile);
  }

  return profiles;
}
