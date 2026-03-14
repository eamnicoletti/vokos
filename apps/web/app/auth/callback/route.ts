import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

function safeAuthPath(value: string | null): "/login" | "/cadastro" {
  return value === "signup" ? "/cadastro" : "/login";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstNonEmptyString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function buildFullName(metadata: Record<string, unknown>) {
  const givenName = firstNonEmptyString(metadata.given_name);
  const familyName = firstNonEmptyString(metadata.family_name);

  if (!givenName && !familyName) {
    return null;
  }

  return [givenName, familyName].filter(Boolean).join(" ");
}

function extractGoogleProfile(user: {
  user_metadata?: unknown;
  identities?: Array<{ provider?: string; identity_data?: unknown }>;
}) {
  const userMetadata = isRecord(user.user_metadata) ? user.user_metadata : {};
  const googleIdentity = user.identities?.find((identity) => identity.provider === "google");
  const identityData = isRecord(googleIdentity?.identity_data) ? googleIdentity.identity_data : {};

  return {
    fullName: firstNonEmptyString(
      userMetadata.full_name,
      userMetadata.name,
      buildFullName(userMetadata),
      identityData.full_name,
      identityData.name,
      buildFullName(identityData)
    ),
    avatarUrl: firstNonEmptyString(userMetadata.avatar_url, userMetadata.picture, identityData.avatar_url, identityData.picture)
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const authPath = safeAuthPath(requestUrl.searchParams.get("mode"));
  const fallbackUrl = new URL(authPath, requestUrl.origin);
  fallbackUrl.searchParams.set("next", nextPath);

  if (!code) {
    return NextResponse.redirect(fallbackUrl);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(fallbackUrl);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const userMetadata = isRecord(user.user_metadata) ? user.user_metadata : {};
    const { fullName, avatarUrl } = extractGoogleProfile(user);
    const updates: Record<string, string> = {};

    if (!firstNonEmptyString(userMetadata.full_name) && fullName) {
      updates.full_name = fullName;
    }

    if (!firstNonEmptyString(userMetadata.avatar_url) && avatarUrl) {
      updates.avatar_url = avatarUrl;
    }

    if (Object.keys(updates).length > 0) {
      const admin = createAdminSupabaseClient();
      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...userMetadata,
          ...updates
        }
      });

      if (updateError) {
        console.error("Failed to persist Google profile metadata:", updateError.message);
      }
    }
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
