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
export default function HolidayGifts() {
  return (
    <div className="holiday-theme">
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
            <Image src="/images/holiday/gwaup-holiday-full-set.png" alt="Gwaup Boys holiday gift collection design preview showing tumbler, coaster, dog tag, air freshener, custom shirt and phone pop" width={1122} height={1402} priority sizes="(max-width: 1024px) 100vw, 50vw" className="h-auto w-full object-contain" />
            <figcaption className="border-t border-white/10 px-5 py-3 text-sm text-zinc-300">Full $50 collection shown as a professional design preview. Shirt included at $45; shirt + phone pop at $50. Final artwork and print colors confirmed before production.</figcaption>
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
                <Link href={`/holiday-gifts/customize?bundle=${["set", "shirt", "complete"][index]}`} className="btn w-full bg-amber-200 text-zinc-950">Customize this bundle</Link>
              </article>
            ))}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-400">Choose your bundle, add your design details, then review and send your request. Payment is arranged after availability, timing, tax and delivery details are confirmed. This page does not take payment. Production follows artwork approval. Sublimated shirts use white or light-colored polyester; final sizes and availability are confirmed.</p>
        </div>
      </section>

      <section className="border-y border-amber-200/20 bg-gradient-to-b from-emerald-950/40 via-zinc-950 to-amber-950/25 py-16">
        <div className="shell">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow">Make it yours</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">One theme. A whole collection.</h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-300">See the matching look from tumbler to tee. Choose your colors, names and theme, then pick the bundle that fits your gift.</p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">All images below are styled design previews, not photographs of completed orders. The $25 set includes four accessories; the shirt is added at $45 and the phone pop at $50. Final artwork, materials, colors and availability are confirmed before production.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              { name: "Gwaup Boys", image: "gwaup-holiday-full-set.png" },
              { name: "WNS", image: "wns-holiday-full-set.png" },
              { name: "Exotica Hair Studio", image: "exotica-holiday-full-set.png" },
              { name: "Deepgram", image: "deepgram-holiday-full-set.png" },
              { name: "Your Logo Here", image: "your-logo-holiday-full-set.png" },
            ].map((design) => <figure key={design.name} className="overflow-hidden rounded-3xl border border-amber-200/25 bg-zinc-900 shadow-xl">
              <a href={`/images/holiday/${design.image}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${design.name} gift collection full size`}>
                <Image src={`/images/holiday/${design.image}`} alt={`${design.name} design preview with coordinated tumbler, coaster, dog tag, air freshener, shirt and phone pop`} width={1122} height={1402} sizes="(max-width: 768px) 100vw, 50vw" className="h-auto w-full" />
              </a>
              <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4"><span className="font-bold">{design.name}</span><span className="text-xs uppercase tracking-wider text-amber-200">Full $50 collection</span></figcaption>
            </figure>)}
          </div>
          <Link href="/contact" className="btn btn-secondary mt-8">Talk through your design</Link>
        </div>
      </section>
    </div>
  );
}
