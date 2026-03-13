import type { Route } from "next"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string; organization?: string }>;
}) {
  const { next, email, organization } = await searchParams
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect((next || "/dashboard") as Route)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm mode="signup" nextPath={next} initialEmail={email} invitationOrganization={organization} />
      </div>
    </div>
  )
}
