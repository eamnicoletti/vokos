export type UserProfileSummary = {
  id: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
};

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

export function fallbackNameFromEmail(email: string | null | undefined, fallback = "Usuário Vokos") {
  const candidate = email?.split("@")[0]?.replace(/[._-]+/g, " ")?.trim();

  if (!candidate) {
    return fallback;
  }

  return candidate
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveDisplayName(params: {
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  fallback?: string;
}) {
  return (
    firstNonEmptyString(params.fullName, params.name) ??
    fallbackNameFromEmail(params.email, params.fallback)
  );
}

export function resolveAvatarUrl(params: {
  avatarUrl?: string | null;
  picture?: string | null;
}) {
  return firstNonEmptyString(params.avatarUrl, params.picture);
}

export function getUserInitials(name: string | null | undefined, email?: string | null, fallback = "VK") {
  const source = firstNonEmptyString(name) ?? fallbackNameFromEmail(email, fallback);

  if (!source) {
    return fallback;
  }

  const initials = source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || fallback;
}

export function profileFromAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: unknown;
}): UserProfileSummary {
  const metadata = isRecord(user.user_metadata) ? user.user_metadata : {};
  const email = user.email ?? "";

  return {
    id: user.id,
    email,
    name: resolveDisplayName({
      fullName: firstNonEmptyString(metadata.full_name),
      name: firstNonEmptyString(metadata.name),
      email
    }),
    avatarUrl: resolveAvatarUrl({
      avatarUrl: firstNonEmptyString(metadata.avatar_url),
      picture: firstNonEmptyString(metadata.picture)
    })
  };
}
