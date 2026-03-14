import { getMyAccountBillingOverview } from "@/lib/db/billing";
import { requirePageSession } from "@/lib/server/require-page-session";
import { AccountBillingPanel } from "@/features/billing/account-billing-panel";

export default async function AccountBillingPage() {
  await requirePageSession("/conta/cobrancas");
  const overview = await getMyAccountBillingOverview();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <AccountBillingPanel overview={overview} />
    </main>
  );
}
