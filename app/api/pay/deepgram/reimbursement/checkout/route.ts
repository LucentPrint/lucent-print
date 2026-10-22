import { NextResponse } from "next/server";
import Stripe from "stripe";
import { reimbursementCheckoutSchema } from "@/lib/reimbursement";
import { buildReimbursementCheckout, reimbursementIdempotencyKey } from "@/lib/reimbursement-checkout";

export const runtime = "nodejs";
const responseHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function POST(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lucent-print.vercel.app";
  let origin: string;
  try {
    const url = new URL(siteUrl);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid site URL");
    origin = url.origin;
  } catch {
    return NextResponse.json({ error: "Reimbursement checkout is temporarily unavailable. Please contact Lucent Print." }, { status: 503, headers: responseHeaders });
  }

  const requestOrigin = req.headers.get("origin");
  if (requestOrigin && requestOrigin !== origin) {
    return NextResponse.json({ error: "Please open this reimbursement on the Lucent Print website." }, { status: 403, headers: responseHeaders });
  }
  if (Number(req.headers.get("content-length")) > 2048) {
    return NextResponse.json({ error: "Your checkout request is too long." }, { status: 413, headers: responseHeaders });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (Buffer.byteLength(text, "utf8") > 2048) return NextResponse.json({ error: "Your checkout request is too long." }, { status: 413, headers: responseHeaders });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "We could not read the checkout request. Please try again." }, { status: 400, headers: responseHeaders });
  }
  const parsed = reimbursementCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please reopen the reimbursement page and select Pay reimbursement." }, { status: 400, headers: responseHeaders });
  }

  const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Reimbursement checkout is not available yet. Please contact Lucent Print." }, { status: 503, headers: responseHeaders });
  }

  try {
    const stripe = new Stripe(apiKey);
    const created = await stripe.checkout.sessions.create(buildReimbursementCheckout(parsed.data, origin), {
      idempotencyKey: reimbursementIdempotencyKey(parsed.data),
    });
    // A retry can replay an old create response; retrieve the current state
    // before reopening an expired or already completed payment attempt.
    const session = await stripe.checkout.sessions.retrieve(created.id);
    if (session.status === "expired") {
      return NextResponse.json({ code: "checkout_expired", error: "That checkout expired. Select Pay reimbursement again to open a fresh checkout." }, { status: 409, headers: responseHeaders });
    }
    if (session.status === "complete") {
      return NextResponse.json({ confirmationPath: `/pay/deepgram/reimbursement/success?session_id=${encodeURIComponent(session.id)}` }, { headers: responseHeaders });
    }
    if (!session.url) throw new Error("Checkout unavailable");
    return NextResponse.json({ url: session.url }, { headers: responseHeaders });
  } catch {
    return NextResponse.json({ error: "We could not open secure checkout. Please try again or contact Lucent Print." }, { status: 502, headers: responseHeaders });
  }
}
