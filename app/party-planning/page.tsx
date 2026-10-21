import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, CreditCard, MessageCircle, PartyPopper, Sparkles } from "lucide-react";
import { ReservationAddonButton } from "@/components/reservation-addon-button";
import { ReservationForm } from "@/components/reservation-form";
import { EVENT_TYPES, RESERVATION_ADDON_NAME, RESERVATION_ADDON_PRICE, RESERVATION_CURRENCY, RESERVATION_NAME, RESERVATION_PRICE } from "@/lib/reservations";

export const metadata: Metadata = {
  title: "Party Planning & Reservations",
  description: "Plan your celebration with Lucent Print, book our $390 Reservation Booking Service, or pay for a $60 reservation add-on through Stripe.",
  alternates: { canonical: "/party-planning" },
};

const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: RESERVATION_CURRENCY,
}).format(RESERVATION_PRICE / 100);
const addonPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: RESERVATION_CURRENCY,
}).format(RESERVATION_ADDON_PRICE / 100);

export default async function PartyPlanningPage({ searchParams }: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const { checkout } = await searchParams;
  const cancelled = checkout === "cancelled";

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 py-14 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full bg-pink-500/[.08] blur-3xl" />
        <div className="shell relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <div>
            <p className="eyebrow flex items-center gap-2"><Sparkles size={15} aria-hidden="true" /> Party Planning &amp; Reservations</p>
            <h1 className="title mt-6 max-w-3xl">Your moment.<br /><span className="bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">Made memorable.</span></h1>
            <p className="muted mt-6 max-w-xl text-lg leading-relaxed">Birthdays, baby showers, and the moments that bring everyone together. Tell us what you&apos;re celebrating, and let&apos;s start with your vision.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#reservation" className="btn btn-primary gap-2">Book reservation service <ArrowRight size={18} aria-hidden="true" /></a>
              <Link href="/party-planning/add-on" className="btn btn-secondary gap-2">{addonPrice} reservation add-on <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2" aria-label="Event types">
              {EVENT_TYPES.map((type) => <span key={type} className="rounded-full border border-white/10 bg-white/[.025] px-3 py-1.5 text-xs text-zinc-300">{type}</span>)}
            </div>
          </div>

          <div className="glass relative rounded-[28px] p-7 sm:p-9">
            <div className="mb-7 flex items-center justify-between">
              <span className="rounded-2xl bg-pink-500/15 p-4 text-pink-300"><PartyPopper size={34} aria-hidden="true" /></span>
              <span className="rounded-full border border-pink-400/20 bg-pink-500/[.08] px-3 py-1.5 text-xs font-bold text-pink-200">Let&apos;s celebrate</span>
            </div>
            <p className="eyebrow text-pink-300">Party planning</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Every good party<br />starts with an idea.</h2>
            <p className="muted mt-5 leading-relaxed">Share your occasion, your theme, and the planning help you&apos;re looking for. Start a conversation about your celebration.</p>
            <Link href="/contact" className="btn btn-secondary mt-7 w-full gap-2 border-pink-400/30 hover:bg-pink-500/10"><MessageCircle size={18} aria-hidden="true" /> Email about party planning <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section id="add-on" aria-labelledby="reservation-addon-heading" className="scroll-mt-24 border-b border-white/10 py-10 sm:py-12">
        <div className="shell">
          <div className="glass grid items-center gap-7 rounded-[28px] border-pink-400/20 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            <div>
              <p className="eyebrow flex items-center gap-2 text-pink-300"><CreditCard size={16} aria-hidden="true" /> Quick payment</p>
              <h2 id="reservation-addon-heading" className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{RESERVATION_ADDON_NAME}</h2>
              <p className="muted mt-3 max-w-xl leading-relaxed">An extra one-time payment for your reservation booking service. Continue straight to Stripe and use the email connected to your reservation.</p>
              <Link href="/party-planning/add-on" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-pink-300 hover:text-pink-200">View add-on details <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <div className="w-full lg:max-w-sm lg:justify-self-end">
              <div className="mb-5 flex flex-wrap items-baseline gap-3">
                <p className="text-4xl font-black tracking-tight text-blue-300">{addonPrice}</p>
                <p className="text-sm text-zinc-400">USD · one-time</p>
              </div>
              <ReservationAddonButton />
            </div>
          </div>
        </div>
      </section>

      <section id="reservation" className="scroll-mt-24 py-14 sm:py-20">
        <div className="shell grid items-start gap-8 lg:grid-cols-[.8fr_1.4fr] lg:gap-12">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">{RESERVATION_NAME}</p>
            <h2 className="mt-4 max-w-md text-3xl font-black tracking-tight sm:text-4xl">Start with your<br />event details.</h2>
            <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-2">
              <p className="text-5xl font-black tracking-tight text-blue-300">{price}</p>
              <p className="pb-1 text-sm text-zinc-400">USD · one-time</p>
            </div>
            <p className="muted mt-5 max-w-md leading-relaxed">Complete the form, then continue to Stripe to pay for the reservation booking service.</p>

            <div className="mt-7 space-y-5 rounded-2xl border border-blue-400/20 bg-blue-500/[.06] p-5">
              <div className="flex gap-3">
                <CalendarDays size={21} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
                <div><h3 className="font-bold">Your date is a request.</h3><p className="muted mt-1 text-sm leading-relaxed">Payment does not automatically confirm availability. Your event date and details still require confirmation.</p></div>
              </div>
              <div className="flex gap-3 border-t border-blue-400/15 pt-5">
                <Clock3 size={20} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
                <div><h3 className="text-sm font-bold">Las Vegas / Pacific time</h3><p className="muted mt-1 text-sm">Use Pacific time for your preferred event start.</p></div>
              </div>
            </div>
            <p className="muted mt-6 text-sm">Have a question before you pay? <Link href="/contact" className="font-bold text-pink-300 underline underline-offset-4 hover:text-pink-200">Contact us.</Link></p>
          </div>

          <ReservationForm cancelled={cancelled} />
        </div>
      </section>
    </>
  );
}
