import type { Metadata } from "next";
import Link from "next/link";
import { Building2, FileText, Mail } from "lucide-react";
import { DeepgramPaymentButtons } from "@/components/deepgram-payment-buttons";
import { DEEPGRAM_INVOICE_NUMBER } from "@/lib/deepgram-invoice";

const title = `Lucent Print — Invoice ${DEEPGRAM_INVOICE_NUMBER}.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description: "Secure invoice payment with Lucent Print.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  openGraph: { title, description: "Secure invoice payment with Lucent Print.", url: "/pay/deepgram", images: [] },
  twitter: { card: "summary", title, description: "Secure invoice payment with Lucent Print.", images: [] },
};

export default function DeepgramInvoicePage() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-6 size-[440px] rounded-full bg-pink-500/[.07] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 size-[440px] rounded-full bg-blue-500/[.08] blur-3xl" />
      <div className="shell relative max-w-4xl">
        <div className="glass overflow-hidden rounded-[28px]">
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="eyebrow flex items-center gap-2"><FileText size={15} aria-hidden="true" /> Invoice payment</p>
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3.5 py-2 font-mono text-xs text-zinc-300">{DEEPGRAM_INVOICE_NUMBER}</span>
            </div>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Deepgram<br className="sm:hidden" /> <span className="bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">centerpieces.</span></h1>
            <p className="muted mt-4 max-w-xl leading-relaxed">Choose the payment you&apos;re making for invoice {DEEPGRAM_INVOICE_NUMBER}. Each option is a separate, one-time payment.</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-300"><Building2 size={17} className="text-blue-300" aria-hidden="true" /> Prepared for Deepgram</div>
          </div>

          <div className="border-t border-white/10 p-6 sm:p-10">
            <DeepgramPaymentButtons />
            <div className="mt-7 flex gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:p-5">
              <Mail size={20} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
              <p className="muted text-sm leading-relaxed">At checkout, enter your company name and use <strong className="font-semibold text-zinc-200">Deepgram&apos;s accounts payable email</strong> for the payment receipt.</p>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-5 text-center sm:px-10">
            <p className="muted text-sm">Questions about this invoice? <Link href="/contact" className="font-bold text-pink-300 underline underline-offset-4 hover:text-pink-200">Contact Lucent Print.</Link></p>
          </div>
        </div>
      </div>
    </section>
  );
}
