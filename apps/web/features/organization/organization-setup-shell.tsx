"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";

type OrganizationSetupShellProps = PropsWithChildren<{
  userEmail: string;
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}>;

export function OrganizationSetupShell({
  userEmail,
  eyebrow,
  title,
  description,
  aside,
  children
}: OrganizationSetupShellProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.25),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(247,247,245,1))] px-4 py-6 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_24%),linear-gradient(180deg,_rgba(15,15,15,1),_rgba(10,10,10,1))] dark:text-slate-50 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,_rgba(15,23,42,0.08),_transparent_70%)] dark:bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_transparent_70%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-3">
            <Logo className="h-9" />
            <div className="space-y-2">
              <Badge variant="outline" className="rounded-full border-slate-300/80 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.24em] dark:border-white/15 dark:bg-white/5">
                {eyebrow}
              </Badge>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          </div>
          <div className="rounded-lg border border-muted-foreground/10 px-4 py-3 text-sm shadow-lg ">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">conta conectada</div>
            <div className="mt-1 font-medium">{userEmail}</div>
          </div>
        </div>

        <div className={aside ? "grid gap-6 xl:grid-cols-[1.1fr_1.9fr]" : "w-full"}>
          {children}
          {aside ? aside : null}
        </div>
      </div>
    </main>
  );
}
