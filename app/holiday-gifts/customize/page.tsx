import type { Metadata } from "next";
import Link from "next/link";
import { HolidayGiftCheckout } from "@/components/HolidayGiftCheckout";
import { HOLIDAY_BUNDLES, HOLIDAY_DESIGNS } from "@/lib/holiday-gifts";
export const metadata: Metadata = { title: "Customize your holiday gift set", description: "Choose your gift bundle and personalize the details. Review your request before payment." };
export default async function CustomizeHoliday({ searchParams }: { searchParams: Promise<{ bundle?: string; design?: string }> }) {
  const query = await searchParams;
  const bundle = query.bundle && Object.hasOwn(HOLIDAY_BUNDLES, query.bundle) ? query.bundle as keyof typeof HOLIDAY_BUNDLES : "set";
  const design = query.design && Object.hasOwn(HOLIDAY_DESIGNS, query.design) ? query.design as keyof typeof HOLIDAY_DESIGNS : "custom";
  return <section className="section"><div className="shell max-w-5xl"><Link href="/holiday-gifts" className="text-sm text-amber-200">← Holiday gift sets</Link><p className="eyebrow mt-8">Made to match. Made for them.</p><h1 className="my-4 text-4xl font-black sm:text-5xl">Make this gift theirs.</h1><p className="mb-8 max-w-2xl text-zinc-300">Pick a bundle, add the personal details, then review it all in one place. We’ll confirm the design, availability, delivery and final total before payment.</p><HolidayGiftCheckout key={`${bundle}-${design}`} initialBundle={bundle} initialDesign={design} /></div></section>;
}
