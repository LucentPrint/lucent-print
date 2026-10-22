import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Mail, ReceiptText } from "lucide-react";
import { ReimbursementPaymentButton } from "@/components/reimbursement-payment-button";
import { REIMBURSEMENT_AMOUNT, REIMBURSEMENT_CURRENCY, REIMBURSEMENT_ITEMS, REIMBURSEMENT_NAME } from "@/lib/reimbursement";

const title = `Lucent Print — ${REIMBURSEMENT_NAME}`;
const description = "One-time $691.07 USD materials reimbursement for Deepgram’s Sound On 2026 centerpiece project.";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: REIMBURSEMENT_CURRENCY });

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  openGraph: { title, description, url: "/pay/deepgram/reimbursement", images: [] },
  twitter: { card: "summary", title, description, images: [] },
};

export default function DeepgramReimbursementPage() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-6 size-[440px] rounded-full bg-pink-500/[.07] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 size-[440px] rounded-full bg-blue-500/[.08] blur-3xl" />
      <div className="shell relative max-w-3xl">
        <div className="glass overflow-hidden rounded-[28px]">
          <div className="p-6 sm:p-10">
            <p className="eyebrow flex items-center gap-2"><ReceiptText size={15} aria-hidden="true" /> Sound On 2026</p>
            <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-5xl">Materials<br /><span className="bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">reimbursement.</span></h1>
            <p className="muted mt-4 max-w-xl leading-relaxed">Reimbursement for materials purchased for Deepgram&apos;s Sound On 2026 centerpiece project.</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-300"><Building2 size={17} className="text-blue-300" aria-hidden="true" /> Prepared for Deepgram</div>
          </div>

          <div className="border-t border-white/10 p-6 sm:p-10">
            <h2 className="text-xl font-bold">Materials breakdown</h2>
            <dl className="mt-5 space-y-4">
              {REIMBURSEMENT_ITEMS.map((item) => (
                <div key={item.name} className="flex items-baseline justify-between gap-4 text-base">
                  <dt className="text-zinc-300">{item.name}</dt>
                  <dd className="font-semibold tabular-nums">{money.format(item.amount / 100)}</dd>
                </div>
              ))}
              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
                <dt className="font-bold">Total reimbursement<span className="muted mt-1 block text-xs font-normal">One-time payment · Due on receipt</span></dt>
                <dd className="text-4xl font-black tracking-tight tabular-nums">{money.format(REIMBURSEMENT_AMOUNT / 100)} <span className="text-xs font-medium text-zinc-400">USD</span></dd>
              </div>
            </dl>
            <div className="mt-7"><ReimbursementPaymentButton /></div>
            <div className="mt-7 flex gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:p-5">
              <Mail size={20} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
              <p className="muted text-sm leading-relaxed">At checkout, enter your company name and use <strong className="font-semibold text-zinc-200">Deepgram&apos;s accounts payable email</strong> for the payment receipt.</p>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-5 text-center sm:px-10">
            <p className="muted text-sm">Questions about this reimbursement? <Link href="/contact" className="font-bold text-pink-300 underline underline-offset-4 hover:text-pink-200">Contact Lucent Print.</Link></p>
          </div>
        </div>
      </div>
    </section>
  );
}
