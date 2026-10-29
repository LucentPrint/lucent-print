import type Stripe from "stripe";
import {
  SUPPORT_AMOUNT, SUPPORT_CURRENCY, SUPPORT_NAME,
  SUPPORT_REFERENCE, SUPPORT_SERVICE, SUPPORT_VERSION,
  type SupportCheckoutInput,
} from "./support";

export function buildSupportCheckout(input: SupportCheckoutInput, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const origin = new URL(siteUrl).origin;
  const metadata = {
    service: SUPPORT_SERVICE,
    schema_version: SUPPORT_VERSION,
    invoice_number: SUPPORT_REFERENCE,
    request_id: input.clientRequestId,
    service_description: SUPPORT_NAME,
    service_start_date: "2026-10-26",
    service_end_date: "2026-10-29",
  };
  return {
    mode: "payment",
    integration_identifier: "lucent_support_qmxvtrka",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: SUPPORT_CURRENCY,
        unit_amount: SUPPORT_AMOUNT,
        product_data: {
          name: SUPPORT_NAME,
          description: "Onsite and on-call event support, October 26–29, 2026. Flat support fee only; no reimbursements. Invoice LP-2026-1027-ES.",
          metadata: { service: SUPPORT_SERVICE, invoice_number: SUPPORT_REFERENCE },
        },
      },
    }],
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    customer_creation: "always",
    name_collection: { business: { enabled: true, optional: false } },
    client_reference_id: SUPPORT_REFERENCE,
    metadata,
    payment_intent_data: {
      metadata,
      description: `${SUPPORT_NAME} · October 26–29, 2026 · ${SUPPORT_REFERENCE}`,
    },
    submit_type: "pay",
    custom_text: {
      submit: { message: "One-time $1,350.00 USD onsite and on-call event support. Invoice LP-2026-1027-ES. No reimbursements. Enter Deepgram’s accounts payable email for the payment receipt." },
    },
    success_url: `${origin}/pay/deepgram/support/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay/deepgram/support`,
  };
}

export function supportIdempotencyKey(input: SupportCheckoutInput) {
  return `support-v${SUPPORT_VERSION}-${SUPPORT_REFERENCE}-${input.clientRequestId}`;
}

type SupportSession = Pick<Stripe.Checkout.Session, "metadata" | "mode" | "payment_status" | "currency" | "amount_total" | "status">;

// Recognize either identity field before validation so malformed support
// payments cannot reach merchandise fulfillment.
export function isSupportSession(session: Pick<SupportSession, "metadata">) {
  return session.metadata?.service === SUPPORT_SERVICE ||
    session.metadata?.invoice_number === SUPPORT_REFERENCE;
}

export function supportPaymentState(session: SupportSession): "paid" | "processing" | "incomplete" | "invalid" {
  const metadata = session.metadata;
  if (metadata?.service !== SUPPORT_SERVICE || !["1", SUPPORT_VERSION].includes(metadata.schema_version) ||
    metadata.invoice_number !== SUPPORT_REFERENCE || session.mode !== "payment" ||
    session.currency !== SUPPORT_CURRENCY || session.amount_total !== SUPPORT_AMOUNT) {
    return "invalid";
  }
  if (session.status === "complete" && session.payment_status === "paid") return "paid";
  if (session.status === "complete" && session.payment_status === "unpaid") return "processing";
  return "incomplete";
}

export function validSupportSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_[a-zA-Z0-9_]{10,240}$/.test(value);
}
