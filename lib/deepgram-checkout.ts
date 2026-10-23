import type Stripe from "stripe";
import {
  DEEPGRAM_CURRENCY, DEEPGRAM_INVOICE_NUMBER, deepgramPaymentAmount,
  DEEPGRAM_SERVICE, DEEPGRAM_VERSION, deepgramPaymentName,
  type DeepgramCheckoutInput, type DeepgramPaymentPart,
} from "./deepgram-invoice";

export function buildDeepgramCheckout(input: DeepgramCheckoutInput, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const origin = new URL(siteUrl).origin;
  const metadata = {
    service: DEEPGRAM_SERVICE,
    schema_version: DEEPGRAM_VERSION,
    invoice_number: DEEPGRAM_INVOICE_NUMBER,
    payment_part: input.part,
    request_id: input.clientRequestId,
  };
  return {
    mode: "payment",
    // Use Stripe's default hosted page, matching the site's existing checkouts.
    // The current API renamed its hosted-mode enum; no embedded UI is requested.
    payment_method_types: ["card"],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: DEEPGRAM_CURRENCY,
        unit_amount: deepgramPaymentAmount(input.part),
        product_data: {
          name: deepgramPaymentName(input.part),
          description: `Lucent Print — Invoice ${DEEPGRAM_INVOICE_NUMBER}`,
          metadata: { service: DEEPGRAM_SERVICE, invoice_number: DEEPGRAM_INVOICE_NUMBER, payment_part: input.part },
        },
      },
    }],
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    customer_creation: "always",
    name_collection: { business: { enabled: true, optional: false } },
    client_reference_id: `${DEEPGRAM_INVOICE_NUMBER}-${input.part}`,
    metadata,
    payment_intent_data: {
      metadata,
      description: `${deepgramPaymentName(input.part)} · Invoice ${DEEPGRAM_INVOICE_NUMBER}`,
    },
    submit_type: "pay",
    custom_text: {
      submit: { message: `Invoice ${DEEPGRAM_INVOICE_NUMBER}. Enter Deepgram’s accounts payable email for the payment receipt. This is a one-time $${(deepgramPaymentAmount(input.part) / 100).toFixed(2)} USD ${input.part} payment.` },
    },
    success_url: `${origin}/pay/deepgram/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay/deepgram`,
  };
}

export function deepgramIdempotencyKey(input: DeepgramCheckoutInput) {
  return `deepgram-v${DEEPGRAM_VERSION}-${DEEPGRAM_INVOICE_NUMBER}-${input.part}-${input.clientRequestId}`;
}

type DeepgramSession = Pick<Stripe.Checkout.Session, "metadata" | "mode" | "payment_status" | "currency" | "amount_total" | "status">;

// Recognize invoice checkouts before validation so malformed invoice payments
// cannot fall through to the site's merchandise fulfillment.
export function isDeepgramSession(session: Pick<DeepgramSession, "metadata">) {
  return session.metadata?.service === DEEPGRAM_SERVICE || session.metadata?.invoice_number === DEEPGRAM_INVOICE_NUMBER;
}

export function deepgramPaymentState(session: DeepgramSession): "paid" | "processing" | "incomplete" | "invalid" {
  const metadata = session.metadata;
  if (metadata?.service !== DEEPGRAM_SERVICE || metadata.schema_version !== DEEPGRAM_VERSION ||
    metadata.invoice_number !== DEEPGRAM_INVOICE_NUMBER || !["deposit", "balance"].includes(metadata.payment_part) ||
    session.mode !== "payment" || session.currency !== DEEPGRAM_CURRENCY || session.amount_total !== deepgramPaymentAmount(metadata.payment_part as DeepgramPaymentPart)) {
    return "invalid";
  }
  if (session.status === "complete" && session.payment_status === "paid") return "paid";
  if (session.status === "complete" && session.payment_status === "unpaid") return "processing";
  return "incomplete";
}

export function validDeepgramSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_[a-zA-Z0-9_]{10,240}$/.test(value);
}
