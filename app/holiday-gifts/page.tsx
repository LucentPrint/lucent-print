import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Holiday Gift Sets",
  description: "Make it personal this holiday. Coordinated custom gift sets from $25, with custom shirt and phone-grip options.",
};

const bundles = [
  { price: 25, title: "The coordinated set", note: "Four gifts. One matching look.", items: ["Custom tumbler", "Matching coaster", "Dog tag", "Air freshener"] },
  { price: 45, title: "Wear the whole vibe", note: "The set + a custom shirt.", items: ["Everything in the $25 set", "One coordinating custom shirt"] },
  { price: 50, title: "The full collection", note: "The set + shirt + phone grip.", items: ["Everything in the $45 bundle", "One matching phone grip"] },
];
function inquiry(title: string, price: number) {
  return `mailto:lu@lucentprintlic.com?subject=${encodeURIComponent("Holiday gift set: " + title)}&body=${encodeURIComponent("Hi Lu! I’m interested in the $" + price + " holiday bundle: " + title + ".\n\nDesign/theme:\nName or wording:\nQuantity:\nShirt size (if included):\nDate needed:\nPickup or shipping:\n")}`;
}
export default function HolidayGifts() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-amber-200/20 bg-[radial-gradient(ellipse_at_top_left,#173f39,transparent_65%)] py-16 sm:py-24">
        <div className="shell grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.24em] text-amber-200">Lucent Print · Holiday special</p>
            <h1 className="title my-6">Their style.<br /><span className="text-amber-200">Your best gift.</span></h1>
            <p className="max-w-lg text-lg leading-relaxed text-zinc-200">A whole collection, made to match. Turn a name, a favorite theme, or your own artwork into a gift that feels like them.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a href="#bundles" className="btn bg-amber-200 text-zinc-950">Explore the bundles</a>
              <span className="text-lg">Sets from <strong className="text-3xl text-amber-200">$25</strong></span>
            </div>
            <p className="mt-5 text-sm text-zinc-300">So many combinations to choose from.</p>
          </div>
          <figure className="overflow-hidden rounded-3xl border border-amber-200/25 bg-zinc-900 shadow-2xl">
            <Image src="/images/holiday/gwaup-set.jpg" alt="Actual Gwaup Boys coordinated tumbler, coaster, dog tag and air freshener made by Lucent Print" width={1200} height={1600} priority className="h-[440px] w-full object-contain sm:h-[530px]" />
            <figcaption className="border-t border-white/10 px-5 py-3 text-sm text-zinc-300">Made by Lucent Print. Actual finished set shown.</figcaption>
          </figure>
        </div>
      </section>

      <section id="bundles" className="section scroll-mt-24">
        <div className="shell">
          <p className="eyebrow">Pick your holiday bundle</p>
          <h2 className="mt-3 text-4xl font-black">Small details. Big gift energy.</h2>
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {bundles.map((bundle, index) => (
              <article key={bundle.price} className={`rounded-3xl border p-7 ${index === 2 ? "border-amber-200/60 bg-amber-200/10" : "border-white/15 bg-white/5"}`}>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-200">{index === 2 ? "The complete match" : "Holiday bundle"}</p>
                <h3 className="mt-4 text-2xl font-bold">{bundle.title}</h3>
                <p className="my-5 text-6xl font-black">${bundle.price}<span className="ml-2 text-sm font-normal text-zinc-400">per bundle</span></p>
                <p className="text-zinc-300">{bundle.note}</p>
                <ul className="my-6 min-h-28 space-y-2 text-zinc-200">{bundle.items.map(item => <li key={item}>✓ {item}</li>)}</ul>
                <a href={inquiry(bundle.title, bundle.price)} className="btn w-full bg-amber-200 text-zinc-950">Request this bundle</a>
              </article>
            ))}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-400">Request an order by email. We’ll confirm your design, availability, timing and any applicable tax or delivery charge before payment. These buttons do not charge you or complete an order.</p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025] py-16">
        <div className="shell grid items-center gap-9 lg:grid-cols-2">
          <Image src="/images/holiday/collection.jpg" alt="Actual Lucent Print coordinated gift collection examples" width={1600} height={1200} className="max-h-[520px] w-full rounded-3xl object-contain" />
          <div>
            <p className="eyebrow">Make it yours</p>
            <h2 className="mt-3 text-4xl font-black">One theme.<br />So many possibilities.</h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-300">Go bold, keep it personal, or create a matching look for your crew. Tell us the colors, names and design you have in mind.</p>
            <p className="mt-4 text-sm text-zinc-400">Photos show examples of finished custom work, not every item included in one bundle. Shirt and phone-grip upgrades are listed above; they are not pictured.</p>
            <Link href="/contact" className="btn btn-secondary mt-7">Talk through your design</Link>
          </div>
        </div>
      </section>
    </>
  );
}
