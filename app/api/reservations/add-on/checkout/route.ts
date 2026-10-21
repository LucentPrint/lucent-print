import { NextResponse } from "next/server";
import Stripe from "stripe";
import { reservationAddonSchema } from "@/lib/reservations";
import { buildReservationAddonCheckout, reservationAddonIdempotencyKey } from "@/lib/reservation-checkout";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lucent-print.vercel.app";
  let origin: string;
  try {
    const url = new URL(siteUrl);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid site URL");
    origin = url.origin;
  } catch {
    return NextResponse.json({ error: "Add-on checkout is temporarily unavailable. Please contact Lucent Print." }, { status: 503 });
  }

  const requestOrigin = req.headers.get("origin");
  if (requestOrigin && requestOrigin !== origin) {
    return NextResponse.json({ error: "Please open the add-on payment page on the Lucent Print website." }, { status: 403 });
  }
  if (Number(req.headers.get("content-length")) > 2048) {
    return NextResponse.json({ error: "Your checkout request is too long." }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 2048) return NextResponse.json({ error: "Your checkout request is too long." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "We could not read the checkout request. Please try again." }, { status: 400 });
  }
  const parsed = reservationAddonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please reopen the add-on payment page and try again." }, { status: 400 });
  }

  const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Add-on checkout is not available yet. Please contact Lucent Print before making a payment." }, { status: 503 });
  }

  try {
    const stripe = new Stripe(apiKey);
    const createdSession = await stripe.checkout.sessions.create(
      buildReservationAddonCheckout(parsed.data, origin),
      { idempotencyKey: reservationAddonIdempotencyKey(parsed.data) },
    );
    // An idempotent retry replays the original creation response. Retrieve the
    // current state so completed or expired attempts are handled correctly.
    const session = await stripe.checkout.sessions.retrieve(createdSession.id);
    if (session.status === "expired") {
      return NextResponse.json({ code: "checkout_expired", error: "That checkout has expired. Select Pay $60.00 again to open a fresh checkout." }, { status: 409 });
    }
    if (session.status === "complete") {
      return NextResponse.json({ confirmationPath: `/party-planning/confirmation?session_id=${encodeURIComponent(session.id)}` }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!session.url) throw new Error("Checkout unavailable");
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We could not open secure checkout. Please try again or contact Lucent Print." }, { status: 502 });
  }
}
