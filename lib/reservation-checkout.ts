// Server-side payment helpers. Customer fields never determine the price or redirect destination.
import { createHash } from "node:crypto";
import type Stripe from "stripe";
import {
  RESERVATION_CURRENCY, RESERVATION_NAME, RESERVATION_PRICE,
  RESERVATION_SERVICE, RESERVATION_TIME_ZONE, RESERVATION_VERSION,
  type ReservationInput,
} from "./reservations";

export function reservationMetadata(input: ReservationInput): Record<string, string> {
  return {
    service: RESERVATION_SERVICE,
    schema_version: RESERVATION_VERSION,
    request_id: input.clientRequestId,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    event_type: input.eventType,
    preferred_date: input.preferredDate,
    preferred_time: input.preferredTime,
    time_zone: RESERVATION_TIME_ZONE,
    guest_count: String(input.guestCount),
    event_location: input.location,
    event_details: input.details,
    date_confirmation: "required",
    date_confirmation_acknowledged: "true",
  };
}

export function buildReservationCheckout(input: ReservationInput, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const origin = new URL(siteUrl).origin;
  const metadata = reservationMetadata(input);
  return {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: RESERVATION_CURRENCY,
        unit_amount: RESERVATION_PRICE,
        product_data: {
          name: RESERVATION_NAME,
          description: "One-time reservation booking service. Your requested event date and details require separate confirmation.",
          metadata: { service: RESERVATION_SERVICE },
        },
      },
    }],
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    customer_email: input.email,
    client_reference_id: input.clientRequestId,
    metadata,
    payment_intent_data: { metadata },
    submit_type: "pay",
    custom_text: { submit: { message: "This $390.00 USD payment is for the Reservation Booking Service. Your requested event date still needs confirmation." } },
    success_url: `${origin}/party-planning/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/party-planning?checkout=cancelled#reservation`,
  };
}

export function reservationIdempotencyKey(input: ReservationInput) {
  const digest = createHash("sha256").update(JSON.stringify(reservationMetadata(input))).digest("hex");
  return `reservation-v${RESERVATION_VERSION}-${digest}`;
}

type ReservationSession = Pick<Stripe.Checkout.Session, "metadata" | "mode" | "payment_status" | "currency" | "amount_total" | "status">;

// Recognize the service even if its version or amount is invalid, so it can never fall through to merchandise fulfillment.
export function isReservationSession(session: Pick<ReservationSession, "metadata">) {
  return session.metadata?.service === RESERVATION_SERVICE;
}

export function reservationPaymentState(session: ReservationSession): "paid" | "processing" | "incomplete" | "invalid" {
  if (!isReservationSession(session) || session.metadata?.schema_version !== RESERVATION_VERSION ||
    session.mode !== "payment" || session.currency !== RESERVATION_CURRENCY || session.amount_total !== RESERVATION_PRICE) {
    return "invalid";
  }
  if (session.payment_status === "paid") return "paid";
  if (session.payment_status === "unpaid" && session.status === "complete") return "processing";
  return "incomplete";
}

export function validCheckoutSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_[a-zA-Z0-9_]{10,240}$/.test(value);
}

// Stripe does not filter Checkout Sessions by metadata. Scan bounded pages and retain a cursor for older records.
export async function listReservationSessions(
  stripe: Pick<Stripe, "checkout">,
  after?: string,
) {
  let cursor = after;
  let scanned = 0;
  let hasMore = false;
  const sessions: Stripe.Checkout.Session[] = [];
  for (let page = 0; page < 5; page += 1) {
    const result = await stripe.checkout.sessions.list({ limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
    scanned += result.data.length;
    sessions.push(...result.data.filter(isReservationSession));
    cursor = result.data.at(-1)?.id;
    hasMore = result.has_more && Boolean(cursor);
    if (sessions.length || !hasMore) break;
  }
  return { sessions, scanned, hasMore, nextCursor: hasMore ? cursor : undefined };
}
