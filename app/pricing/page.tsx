import Link from "next/link";

export const metadata = { title: "Price Comparison Guide" };

export default function PricingPage() {
  return (
    <section className="section">
      <div className="shell max-w-5xl">
        <p className="eyebrow">Transparent pricing</p>
        <h1 className="title my-6">How our prices compare.</h1>
        <p className="muted max-w-3xl text-lg">
          These ranges are a September 2026 market snapshot, not a claimed discount.
          Final prices vary by design, materials, quantity, seller, and shipping.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="glass rounded-3xl p-7">
            <p className="eyebrow">3D sensory clickers</p>
            <h2 className="my-3 text-3xl font-black">Typical: $6–$15</h2>
            <p className="muted">Lucent Print clickers are $10.99 and include detailed printed bodies with satisfying mechanical-switch action.</p>
          </article>
          <article className="glass rounded-3xl p-7">
            <p className="eyebrow text-pink-400">One-off custom shirts</p>
            <h2 className="my-3 text-3xl font-black">Typical: $20–$40</h2>
            <p className="muted">Lucent Print&apos;s current custom-shirt base price is $25.50. Garment upgrades, sizes, placements, and artwork can change the total.</p>
          </article>
        </div>
        <div className="glass mt-6 rounded-3xl p-7">
          <h2 className="text-2xl font-black">Sublimation shirts</h2>
          <p className="muted mt-2">Available starting September 28, 2026. Typical small-business sublimation pricing is about $25–$45 per shirt; Lucent Print pricing will be confirmed after the garment and artwork are reviewed.</p>
        </div>
        <p className="muted mt-8 text-sm">
          Market references: <a className="text-blue-400 underline" href="https://www.peacockperchcreations.com/product-page/keyboard-clicker" target="_blank" rel="noreferrer">Peacock Perch keyboard clickers</a>,{" "}
          <a className="text-blue-400 underline" href="https://www.etsy.com/listing/4517796715/3d-printed-mechanical-keyboard-fidget" target="_blank" rel="noreferrer">Etsy mechanical clickers</a>, and{" "}
          <a className="text-blue-400 underline" href="https://shirt.co/how-much-do-custom-shirts-cost/" target="_blank" rel="noreferrer">2026 custom-shirt pricing guide</a>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/shop">Shop products</Link>
          <Link className="btn btn-secondary" href="/custom-studio">Custom apparel</Link>
        </div>
      </div>
    </section>
  );
}
