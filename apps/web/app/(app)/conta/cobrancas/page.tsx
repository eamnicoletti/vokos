import { getMyAccountBillingOverview } from "@/lib/db/billing";
import { AccountBillingPanel } from "@/features/billing/account-billing-panel";

export default async function AccountBillingPage() {
  const overview = await getMyAccountBillingOverview();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <AccountBillingPanel overview={overview} />
    </main>
  );
}
