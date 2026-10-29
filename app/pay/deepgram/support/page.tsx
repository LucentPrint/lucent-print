import type { Metadata } from "next";
import { SupportPaymentButton } from "@/components/support-payment-button";
import { SUPPORT_REFERENCE } from "@/lib/support";

export const metadata: Metadata = {
  title: { absolute: "Deepgram onsite and on-call event support | Lucent Print" },
  description: "One-time payment for Deepgram onsite and on-call event support, October 26–29, 2026.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function SupportPaymentPage() {
  return (
    <section className="section">
      <div className="shell max-w-3xl">
        <div className="glass rounded-[28px] p-7 sm:p-12">
          <p className="eyebrow">Lucent Print · Invoice payment</p>
          <h1 className="my-5 text-4xl font-black tracking-tight sm:text-5xl">Deepgram onsite and on-call event support</h1>
          <p className="muted text-lg">October 26–29, 2026</p>
          <p className="muted mt-4 break-words font-mono text-sm">Invoice {SUPPORT_REFERENCE}</p>
          <div className="my-8 rounded-2xl border border-current/15 p-6">
            <p className="text-sm font-semibold">One-time support fee</p>
            <p className="mt-3 text-4xl font-black">$1,350.00 <span className="text-base font-medium">USD</span></p>
            <p className="muted mt-4 leading-relaxed">Flat fee for onsite and on-call event support only. No reimbursements are included in this payment.</p>
          </div>
          <SupportPaymentButton />
        </div>
      </div>
    </section>
  );
}
