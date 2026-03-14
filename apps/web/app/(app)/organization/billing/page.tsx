import { redirect } from "next/navigation";
import { getCurrentOrganizationBillingSummary } from "@/lib/db/billing";
import { requirePageSession } from "@/lib/server/require-page-session";
import { OrganizationBillingPanel } from "@/features/billing/organization-billing-panel";

export default async function OrganizationBillingPage() {
  await requirePageSession("/organization/billing");
  const summary = await getCurrentOrganizationBillingSummary();

  if (!summary) {
    redirect("/workspace");
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <OrganizationBillingPanel summary={summary} />
    </main>
  );
}
