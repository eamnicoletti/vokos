import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/auth/authenticated-shell";
import { listMyWorkspaceMemberships } from "@/lib/db/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const memberships = await listMyWorkspaceMemberships();

  return (
    <AuthenticatedShell memberships={memberships} userEmail={user.email ?? ""}>
      {children}
    </AuthenticatedShell>
  );
}
