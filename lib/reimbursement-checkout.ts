import type Stripe from "stripe";
import {
  REIMBURSEMENT_AMOUNT, REIMBURSEMENT_CURRENCY, REIMBURSEMENT_NAME,
  REIMBURSEMENT_REFERENCE, REIMBURSEMENT_SERVICE, REIMBURSEMENT_VERSION,
  type ReimbursementCheckoutInput,
} from "./reimbursement";

export function buildReimbursementCheckout(input: ReimbursementCheckoutInput, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const origin = new URL(siteUrl).origin;
  const metadata = {
    service: REIMBURSEMENT_SERVICE,
    schema_version: REIMBURSEMENT_VERSION,
    reimbursement_reference: REIMBURSEMENT_REFERENCE,
    request_id: input.clientRequestId,
  };
  return {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: REIMBURSEMENT_CURRENCY,
        unit_amount: REIMBURSEMENT_AMOUNT,
        product_data: {
          name: REIMBURSEMENT_NAME,
          description: "Sound On 2026 centerpiece materials: Hobby Lobby $139.07 + Amazon $552.00. One-time reimbursement due on receipt.",
          metadata: { service: REIMBURSEMENT_SERVICE, reimbursement_reference: REIMBURSEMENT_REFERENCE },
        },
      },
    }],
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    customer_creation: "always",
    name_collection: { business: { enabled: true, optional: false } },
    client_reference_id: REIMBURSEMENT_REFERENCE,
    metadata,
    payment_intent_data: {
      metadata,
      description: `${REIMBURSEMENT_NAME} · Hobby Lobby $139.07 + Amazon $552.00`,
    },
    submit_type: "pay",
    custom_text: {
      submit: { message: "One-time $691.07 USD materials reimbursement, due on receipt. Enter Deepgram’s accounts payable email for the payment receipt." },
    },
    success_url: `${origin}/pay/deepgram/reimbursement/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay/deepgram/reimbursement`,
  };
}

export function reimbursementIdempotencyKey(input: ReimbursementCheckoutInput) {
  return `reimbursement-v${REIMBURSEMENT_VERSION}-${REIMBURSEMENT_REFERENCE}-${input.clientRequestId}`;
}

type ReimbursementSession = Pick<Stripe.Checkout.Session, "metadata" | "mode" | "payment_status" | "currency" | "amount_total" | "status">;

// Recognize either identity field before validation so malformed reimbursement
// payments cannot reach merchandise fulfillment.
export function isReimbursementSession(session: Pick<ReimbursementSession, "metadata">) {
  return session.metadata?.service === REIMBURSEMENT_SERVICE ||
    session.metadata?.reimbursement_reference === REIMBURSEMENT_REFERENCE;
}

export function reimbursementPaymentState(session: ReimbursementSession): "paid" | "processing" | "incomplete" | "invalid" {
  const metadata = session.metadata;
  if (metadata?.service !== REIMBURSEMENT_SERVICE || metadata.schema_version !== REIMBURSEMENT_VERSION ||
    metadata.reimbursement_reference !== REIMBURSEMENT_REFERENCE || session.mode !== "payment" ||
    session.currency !== REIMBURSEMENT_CURRENCY || session.amount_total !== REIMBURSEMENT_AMOUNT) {
    return "invalid";
  }
  if (session.status === "complete" && session.payment_status === "paid") return "paid";
  if (session.status === "complete" && session.payment_status === "unpaid") return "processing";
  return "incomplete";
}

export function validReimbursementSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_[a-zA-Z0-9_]{10,240}$/.test(value);
}
