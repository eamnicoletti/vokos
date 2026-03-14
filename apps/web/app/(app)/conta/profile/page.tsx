import { ProfilePanel } from "@/features/account/profile-panel";
import { listMyOrganizations } from "@/lib/db/organizations";
import { requirePageSession } from "@/lib/server/require-page-session";
import { profileFromAuthUser } from "@/lib/user-profile";

export default async function AccountProfilePage() {
  const user = await requirePageSession("/conta/profile");
  const organizations = await listMyOrganizations();
  const profile = profileFromAuthUser(user);
  const metadata =
    user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
  const activeOrganizationId =
    "active_organization_id" in metadata
      ? String(metadata.active_organization_id ?? "")
      : "";
  const customAvatarUrl = "avatar_url" in metadata && typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;
  const providerAvatarUrl = "picture" in metadata && typeof metadata.picture === "string" ? metadata.picture : null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <ProfilePanel
        user={{
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          customAvatarUrl,
          providerAvatarUrl,
          activeOrganizationId: activeOrganizationId || null
        }}
        organizations={organizations}
      />
    </main>
  );
}
