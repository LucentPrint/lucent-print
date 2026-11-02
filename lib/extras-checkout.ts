import type Stripe from "stripe";
import {
  EXTRAS_AMOUNT, EXTRAS_CURRENCY, EXTRAS_NAME,
  EXTRAS_REFERENCE, EXTRAS_SERVICE, EXTRAS_VERSION,
  type ExtrasCheckoutInput,
} from "./extras";

export function buildExtrasCheckout(input: ExtrasCheckoutInput, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const origin = new URL(siteUrl).origin;
  const metadata = {
    service: EXTRAS_SERVICE,
    schema_version: EXTRAS_VERSION,
    invoice_number: EXTRAS_REFERENCE,
    request_id: input.clientRequestId,
    service_description: EXTRAS_NAME,
    merchandise_cents: "24000",
    reimbursement_cents: "16614",
  };
  return {
    mode: "payment",
    integration_identifier: "lucent_extras_bnrwqjsk",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: EXTRAS_CURRENCY,
        unit_amount: EXTRAS_AMOUNT,
        product_data: {
          name: EXTRAS_NAME,
          description: "10 flexi toys ($100), 10 additional sound waves ($80), 10 custom Deepgram coasters ($60), plus expense reimbursement ($166.14). Invoice LP-2026-1101-EX.",
          metadata: { service: EXTRAS_SERVICE, invoice_number: EXTRAS_REFERENCE },
        },
      },
    }],
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    customer_creation: "always",
    name_collection: { business: { enabled: true, optional: false } },
    client_reference_id: EXTRAS_REFERENCE,
    metadata,
    payment_intent_data: {
      metadata,
      description: `${EXTRAS_NAME} · November 1, 2026 · ${EXTRAS_REFERENCE}`,
    },
    submit_type: "pay",
    custom_text: {
      submit: { message: "One-time $406.14 USD: $240.00 additional merchandise and $166.14 expense reimbursement. Invoice LP-2026-1101-EX. No subscription." },
    },
    success_url: `${origin}/pay/deepgram/extras/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay/deepgram/extras`,
  };
}

export function extrasIdempotencyKey(input: ExtrasCheckoutInput) {
  return `extras-v${EXTRAS_VERSION}-${EXTRAS_REFERENCE}-${input.clientRequestId}`;
}

type ExtrasSession = Pick<Stripe.Checkout.Session, "metadata" | "mode" | "payment_status" | "currency" | "amount_total" | "status">;

// Recognize either identity field before validation so malformed extras
// payments cannot reach merchandise fulfillment.
export function isExtrasSession(session: Pick<ExtrasSession, "metadata">) {
  return session.metadata?.service === EXTRAS_SERVICE ||
    session.metadata?.invoice_number === EXTRAS_REFERENCE;
}

export function extrasPaymentState(session: ExtrasSession): "paid" | "processing" | "incomplete" | "invalid" {
  const metadata = session.metadata;
  if (metadata?.service !== EXTRAS_SERVICE || metadata.schema_version !== EXTRAS_VERSION ||
    metadata.invoice_number !== EXTRAS_REFERENCE || session.mode !== "payment" ||
    session.currency !== EXTRAS_CURRENCY || session.amount_total !== EXTRAS_AMOUNT) {
    return "invalid";
  }
  if (session.status === "complete" && session.payment_status === "paid") return "paid";
  if (session.status === "complete" && session.payment_status === "unpaid") return "processing";
  return "incomplete";
}

export function validExtrasSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_[a-zA-Z0-9_]{10,240}$/.test(value);
}
