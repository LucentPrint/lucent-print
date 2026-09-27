import Link from "next/link";
import { TumblerGrid } from "@/components/tumbler-grid";

export const metadata = {
  title: "Tumblers",
  description: "Explore Happy Halloween, Inspirada Bulldogs Halloween and Autumn Pumpkin tumblers from Lucent Print. Request your design and personalization.",
};

export default function TumblersPage() {
  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow text-orange-300">Lucent Print · Drinkware</p>
        <h1 className="title my-6">Tumblers</h1>
        <p className="muted max-w-3xl text-lg">Seasonal designs with personality. Find your favorite below and request a tumbler for yourself, a gift or your team.</p>
        <div className="mb-10 mt-6 flex flex-wrap gap-3">
          <Link href="/pricing#drinkware" className="btn btn-secondary">Drinkware prices &amp; options</Link>
          <Link href="/contact" className="btn btn-secondary">Ask about a custom design</Link>
        </div>
        <TumblerGrid />
        <div className="glass mt-10 rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-black">Make it yours</h2>
          <p className="muted mt-3 max-w-3xl">Send the design name, quantity and any personalization with your request. We’ll confirm the size, availability, final price and pickup or shipping details before you order.</p>
          <Link href="/contact" className="mt-4 inline-block text-orange-300 underline">Contact Lucent Print</Link>
        </div>
      </div>
    </section>
  );
}
