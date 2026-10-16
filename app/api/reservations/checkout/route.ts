import { NextResponse } from "next/server";
import Stripe from "stripe";
import { reservationSchema } from "@/lib/reservations";
import { buildReservationCheckout, reservationIdempotencyKey } from "@/lib/reservation-checkout";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lucent-print.vercel.app";
  let origin: string;
  try {
    const url = new URL(siteUrl);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error("Invalid site URL");
    origin = url.origin;
  } catch {
    return NextResponse.json({ error: "Booking checkout is temporarily unavailable. Please contact Lucent Print." }, { status: 503 });
  }

  const requestOrigin = req.headers.get("origin");
  if (requestOrigin && requestOrigin !== origin) {
    return NextResponse.json({ error: "Please open the booking form on the Lucent Print website." }, { status: 403 });
  }
  if (Number(req.headers.get("content-length")) > 8192) {
    return NextResponse.json({ error: "Your request is too long. Please shorten the event details." }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 8192) return NextResponse.json({ error: "Your request is too long." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "We could not read the booking form. Please try again." }, { status: 400 });
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the booking details and try again.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Booking checkout is not available yet. Please contact Lucent Print before making a payment." }, { status: 503 });
  }

  try {
    const stripe = new Stripe(apiKey);
    const params = buildReservationCheckout(parsed.data, origin);
    const options = { idempotencyKey: reservationIdempotencyKey(parsed.data) };
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(params, options);
    } catch (error) {
      if (!(error instanceof Stripe.errors.StripeIdempotencyError)) throw error;
      // Recover attempts opened before the statement suffix was added. Reuse the
      // original payload and key so retries cannot create a second checkout.
      session = await stripe.checkout.sessions.create({
        ...params,
        payment_intent_data: { metadata: params.metadata },
      }, options);
    }
    if (session.status === "expired") {
      return NextResponse.json({ code: "checkout_expired", error: "That checkout has expired. Your details are saved; select Continue to payment to open a fresh checkout." }, { status: 409 });
    }
    if (session.status === "complete") {
      return NextResponse.json({ confirmationPath: `/party-planning/confirmation?session_id=${encodeURIComponent(session.id)}` }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!session.url) throw new Error("Checkout unavailable");
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We could not open secure checkout. Your details are still here; please try again or contact Lucent Print." }, { status: 502 });
  }
}
