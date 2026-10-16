import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, CircleHelp } from "lucide-react";
import Stripe from "stripe";
import { ReservationDraftClear } from "@/components/reservation-draft-clear";
import { reservationPaymentState, validCheckoutSessionId } from "@/lib/reservation-checkout";

export const metadata: Metadata = {
  title: "Reservation payment",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function ReservationConfirmation({ searchParams }: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  let state: "paid" | "processing" | "incomplete" | "invalid" = "invalid";
  let isTestMode = false;
  if (apiKey && validCheckoutSessionId(sessionId)) {
    try {
      const stripe = new Stripe(apiKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      state = reservationPaymentState(session);
      isTestMode = state !== "invalid" && !session.livemode;
    } catch { /* Never show private Stripe data or claim a payment succeeded when it cannot be verified. */ }
  }

  const copy = {
    paid: {
      title: "Payment received.",
      message: "Your $390.00 USD payment for the Reservation Booking Service is complete.",
      detail: "Your requested event date and details still require confirmation. Contact Lucent Print to confirm availability and discuss the next steps for your event.",
      icon: CheckCircle2,
    },
    processing: {
      title: "Payment is processing.",
      message: "Your checkout is complete, but Stripe has not confirmed the payment yet.",
      detail: "Refresh this page to check again. Please avoid submitting another payment while this one is processing. Your event date still needs separate confirmation.",
      icon: Clock3,
    },
    incomplete: {
      title: "Payment is not complete.",
      message: "Stripe has not recorded a completed payment for this reservation request.",
      detail: "Return to the booking form when you are ready. If you believe you have already paid, contact Lucent Print before trying again.",
      icon: Clock3,
    },
    invalid: {
      title: "We couldn’t verify this payment.",
      message: "A verified reservation payment could not be found using this link.",
      detail: "If you have already paid, contact Lucent Print before making another payment. Your event date requires separate confirmation.",
      icon: CircleHelp,
    },
  }[state];
  const Icon = copy.icon;

  // This public, URL-addressable receipt deliberately renders no customer or event details.
  return (
    <section className="section">
      <div className="shell max-w-3xl">
        {state === "paid" && <ReservationDraftClear />}
        <div className="glass rounded-[28px] p-7 sm:p-12">
          <Icon size={44} className={state === "paid" ? "text-emerald-400" : "text-blue-400"} aria-hidden="true" />
          <p className="eyebrow mt-7">Reservation Booking Service</p>
          {isTestMode && <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm font-bold text-amber-200">Stripe test mode · No real payment was collected.</p>}
          <h1 className="my-5 text-4xl font-black tracking-tight sm:text-5xl">{state === "paid" && isTestMode ? "Test payment complete." : copy.title}</h1>
          <p className="text-lg text-white">{state === "paid" && isTestMode ? "Your test checkout for the $390.00 USD Reservation Booking Service is complete." : copy.message}</p>
          <p className="muted mt-4 leading-relaxed">{copy.detail}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-primary">Contact Lucent Print</Link>
            <Link href="/party-planning" className="btn btn-secondary">Back to party planning</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
