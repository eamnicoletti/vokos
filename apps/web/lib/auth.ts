import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthContext = {
  userId: string;
  workspaceId: string;
  role: "admin" | "manager" | "member";
};

export async function requireAuthContext(): Promise<AuthContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const workspaceId = user.user_metadata.workspace_id as string | undefined;
  const role = user.user_metadata.workspace_role as AuthContext["role"] | undefined;

  if (workspaceId && role) {
    return { userId: user.id, workspaceId, role };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error(membershipError?.message ?? "Workspace membership not found");
  }

  return {
    userId: user.id,
    workspaceId: membership.workspace_id,
    role: membership.role
  };
}
