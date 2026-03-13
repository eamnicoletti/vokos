// Para desenvolvimento local, o caminho mais prático é usar o Stripe CLI:

// Rode stripe login
// Com o app em http://localhost:3000, rode:
// stripe listen --forward-to http://localhost:3000/api/stripe/webhook
// O CLI vai mostrar um whsec_...
// Coloque esse valor em apps/web/.env.local como STRIPE_WEBHOOK_SECRET
// Reinicie pnpm run dev:web

import { NextResponse } from "next/server";
import { constructStripeEvent, handleStripeWebhookEvent } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  let event;

  try {
    event = constructStripeEvent(payload, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook";
    console.error("[stripe-webhook] signature verification failed", {
      message,
      hasSignature: Boolean(signature)
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process Stripe webhook";
    console.error("[stripe-webhook] processing failed", {
      eventId: event.id,
      eventType: event.type,
      message
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
