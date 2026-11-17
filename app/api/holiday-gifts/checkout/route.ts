import { NextResponse } from "next/server";
import { holidaySchema, holidaySubtotal, holidaySummary } from "@/lib/holiday-gifts";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Open this form on the Lucent Print website." }, { status: 403 });
  if (Number(req.headers.get("content-length")) > 8192) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 8192) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch { return NextResponse.json({ error: "Please check your form and try again." }, { status: 400 }); }
  const parsed = holidaySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted details.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  // Preview only. Never create a Stripe session from unconfirmed delivery/tax,
  // accept a client-supplied price, or claim that this request was sent/saved.
  return NextResponse.json({ paymentAvailable: false, requestSent: false, subtotalCents: holidaySubtotal(parsed.data), currency: "usd", summary: holidaySummary(parsed.data), message: "Your customization is ready to review. Lucent Print must confirm the final total and timing before payment." }, { headers: { "Cache-Control": "no-store" } });
}
