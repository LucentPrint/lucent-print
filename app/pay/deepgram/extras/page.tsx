import type { Metadata } from "next";
import { ExtrasPaymentButton } from "@/components/extras-payment-button";
import { EXTRAS_REFERENCE } from "@/lib/extras";
export const metadata: Metadata = {
  title: { absolute: "Deepgram additional merchandise and reimbursement | Lucent Print" },
  description: "One-time invoice payment for additional merchandise and expense reimbursement.",
  robots: { index: false, follow: false }, referrer: "no-referrer",
};
export default function ExtrasPaymentPage() {
  return <section className="section"><div className="shell max-w-3xl"><div className="glass rounded-[28px] p-7 sm:p-12">
    <p className="eyebrow">Lucent Print · Invoice payment</p>
    <h1 className="my-5 text-4xl font-black tracking-tight sm:text-5xl">Deepgram additional merchandise and reimbursement</h1>
    <p className="muted mt-4 break-words font-mono text-sm">Invoice {EXTRAS_REFERENCE}</p>
    <div className="my-8 rounded-2xl border border-current/15 p-6">
      <h2 className="text-xl font-bold">Additional merchandise · $240.00</h2>
      <ul className="muted mt-4 space-y-3"><li>10 flexi toys × $10.00 = $100.00</li><li>10 additional sound waves × $8.00 = $80.00</li><li>10 custom Deepgram coasters × $6.00 = $60.00</li></ul>
      <h2 className="mt-7 text-xl font-bold">Expense reimbursement · $166.14</h2>
      <p className="muted mt-3">Personally paid event expenses, separate from the 60 previously paid accents and the $1,350 support invoice.</p>
      <p className="mt-7 text-sm font-semibold">Total · one-time payment</p>
      <p className="mt-3 text-4xl font-black">$406.14 <span className="text-base font-medium">USD</span></p>
      <p className="muted mt-4">No recurring subscription. This payment does not include any previously paid merchandise.</p>
    </div><ExtrasPaymentButton />
  </div></div></section>;
}
