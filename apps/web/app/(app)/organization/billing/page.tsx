import { redirect } from "next/navigation";
import { getCurrentOrganizationBillingSummary } from "@/lib/db/billing";
import { OrganizationBillingPanel } from "@/features/billing/organization-billing-panel";

export default async function OrganizationBillingPage() {
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
