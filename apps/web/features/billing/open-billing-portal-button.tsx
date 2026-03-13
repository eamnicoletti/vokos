"use client";

import { useTransition } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openOrganizationBillingPortalAction } from "@/app/(app)/organization/billing/actions";

type OpenBillingPortalButtonProps = {
  organizationId: string;
  returnPath: string;
  intent?: "manage" | "upgrade";
  disabled?: boolean;
  children?: React.ReactNode;
};

export function OpenBillingPortalButton({
  organizationId,
  returnPath,
  intent = "manage",
  disabled = false,
  children
}: OpenBillingPortalButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="default"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          const request = openOrganizationBillingPortalAction({
            organizationId,
            returnPath,
            intent
          });

          toast.promise(request, {
            loading: "Abrindo portal de cobranca...",
            success: "Redirecionando para o Stripe...",
            error: (error) => (error instanceof Error ? error.message : "Falha ao abrir o portal de cobranca")
          });

          try {
            const result = await request;
            window.location.assign(result.url);
          } catch {
            // Feedback handled by toast.
          }
        });
      }}
    >
      {isPending ? <LoaderCircle className="animate-spin" /> : <ArrowUpRight />}
      {children ?? "Gerenciar no Stripe"}
    </Button>
  );
}
