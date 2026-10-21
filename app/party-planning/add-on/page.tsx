import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CreditCard, Sparkles } from "lucide-react";
import { ReservationAddonButton } from "@/components/reservation-addon-button";
import { RESERVATION_ADDON_NAME, RESERVATION_ADDON_PRICE, RESERVATION_CURRENCY } from "@/lib/reservations";

export const metadata: Metadata = {
  title: "$60 Reservation Booking Add-On",
  description: "Pay for your $60.00 USD Reservation Booking Service Add-On with Lucent Print. One-time payment through Stripe.",
  alternates: { canonical: "/party-planning/add-on" },
};

const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: RESERVATION_CURRENCY,
}).format(RESERVATION_ADDON_PRICE / 100);

export default async function ReservationAddonPage({ searchParams }: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const { checkout } = await searchParams;

  return (
    <section className="relative overflow-hidden py-12 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-4 size-[420px] rounded-full bg-pink-500/[.08] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-32 size-[420px] rounded-full bg-blue-500/[.07] blur-3xl" />
      <div className="shell relative max-w-5xl">
        <Link href="/party-planning" className="inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> Party planning &amp; reservations</Link>

        <div className="mt-8 grid items-center gap-8 lg:mt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="eyebrow flex items-center gap-2 text-pink-300"><Sparkles size={15} aria-hidden="true" /> Reservation add-on</p>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Your add-on.<br /><span className="bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">One easy payment.</span></h1>
            <p className="muted mt-6 max-w-lg text-lg leading-relaxed">Pay for your reservation booking service add-on in a few clicks.</p>
            <p className="muted mt-4 max-w-lg leading-relaxed">Use the email connected to your reservation at checkout. You can also include a booking reference or event date to help us match your payment.</p>
            <div className="mt-7 flex gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <CalendarDays size={21} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
              <p className="muted text-sm leading-relaxed">Your event date and arrangements still require confirmation with Lucent Print.</p>
            </div>
          </div>

          <div className="glass rounded-[28px] border-pink-400/20 p-7 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-2xl bg-pink-500/15 p-3.5 text-pink-300"><CreditCard size={27} aria-hidden="true" /></span>
              <span className="rounded-full border border-blue-400/20 bg-blue-500/[.08] px-3 py-1.5 text-xs font-bold text-blue-200">One-time payment</span>
            </div>
            <h2 className="mt-7 max-w-sm text-2xl font-bold leading-snug">{RESERVATION_ADDON_NAME}</h2>
            <div className="my-6 flex flex-wrap items-baseline gap-3">
              <p className="text-6xl font-black tracking-tight text-blue-300">{price}</p>
              <p className="text-sm text-zinc-400">USD</p>
            </div>
            <p className="muted mb-7 text-sm leading-relaxed">Continue to Stripe to enter your payment details and complete your add-on purchase.</p>
            {checkout === "cancelled" && (
              <p role="status" className="mb-5 rounded-xl border border-blue-400/25 bg-blue-500/[.07] p-4 text-sm leading-relaxed text-blue-100">You returned from checkout. Select Pay $60.00 whenever you&apos;re ready to continue.</p>
            )}
            <ReservationAddonButton />
            <p className="muted mt-6 border-t border-white/10 pt-5 text-center text-sm">Questions about your add-on? <Link href="/contact" className="font-bold text-pink-300 underline underline-offset-4 hover:text-pink-200">Contact us.</Link></p>
          </div>
        </div>
      </div>
    </section>
  );
}
