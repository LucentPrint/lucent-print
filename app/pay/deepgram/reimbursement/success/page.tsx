import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleHelp, Clock3 } from "lucide-react";
import Stripe from "stripe";
import { REIMBURSEMENT_AMOUNT, REIMBURSEMENT_CURRENCY, REIMBURSEMENT_NAME, REIMBURSEMENT_REFERENCE } from "@/lib/reimbursement";
import { reimbursementPaymentState, validReimbursementSessionId } from "@/lib/reimbursement-checkout";

export const metadata: Metadata = {
  title: { absolute: `Lucent Print — ${REIMBURSEMENT_NAME}` },
  description: "Lucent Print materials reimbursement payment confirmation.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: REIMBURSEMENT_CURRENCY }).format(REIMBURSEMENT_AMOUNT / 100);

export default async function ReimbursementPaymentSuccess({ searchParams }: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  let state: ReturnType<typeof reimbursementPaymentState> = "invalid";
  let isTestMode = false;

  if (apiKey && validReimbursementSessionId(sessionId)) {
    try {
      const session = await new Stripe(apiKey).checkout.sessions.retrieve(sessionId);
      state = reimbursementPaymentState(session);
      if (state !== "invalid") isTestMode = !session.livemode;
    } catch { /* Only a Stripe-verified payment may display a successful confirmation. */ }
  }

  const copy = {
    paid: {
      title: isTestMode ? "Test payment complete" : "Payment received — thank you",
      message: `Your ${amount} USD materials reimbursement for Deepgram Sound On 2026 is complete.`,
      detail: "Keep this confirmation for your records. Contact Lucent Print with any questions about your reimbursement.",
      icon: CheckCircle2,
    },
    processing: {
      title: "Your payment is processing",
      message: "Stripe is still confirming this reimbursement payment.",
      detail: "Refresh this page to check again. Please wait for confirmation before making another payment.",
      icon: Clock3,
    },
    incomplete: {
      title: "Payment is not complete",
      message: "Stripe has not confirmed a completed payment for this reimbursement checkout.",
      detail: "Return to the reimbursement when you are ready. If you believe you have already paid, contact Lucent Print before trying again.",
      icon: Clock3,
    },
    invalid: {
      title: "We couldn’t verify this payment",
      message: "A verified payment for this reimbursement could not be found using this link.",
      detail: "If you have already paid, contact Lucent Print before making another payment.",
      icon: CircleHelp,
    },
  }[state];
  const Icon = copy.icon;

  // This shareable page displays payment status without payer or card details.
  return (
    <section className="section">
      <div className="shell max-w-3xl">
        <div className="glass rounded-[28px] p-7 sm:p-12">
          <Icon size={44} className={state === "paid" ? "text-emerald-400" : "text-blue-400"} aria-hidden="true" />
          <p className="eyebrow mt-7">Deepgram · Sound On 2026</p>
          {isTestMode && <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm font-bold text-amber-200">Stripe test mode · No real payment was collected.</p>}
          <h1 className="my-5 text-4xl font-black tracking-tight sm:text-5xl">{copy.title}</h1>
          <p className="text-lg text-white">{copy.message}</p>
          {state === "paid" && <p className="mt-6 text-4xl font-black text-blue-300">{amount} <span className="text-base font-medium text-zinc-400">USD</span></p>}
          <p className="muted mt-5 leading-relaxed">{copy.detail}</p>
          <p className="mt-5 break-words font-mono text-xs text-zinc-400">Reference: {REIMBURSEMENT_REFERENCE}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pay/deepgram/reimbursement" className="btn btn-primary">Return to reimbursement</Link>
            <Link href="/contact" className="btn btn-secondary">Contact Lucent Print</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
