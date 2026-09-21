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
            <a className="mt-4 inline-flex text-blue-400 underline" href="https://www.etsy.com/search?q=3d%20printed%20keyboard%20fidget%20clicker" rel="noreferrer">View current Etsy clicker listings →</a>
          </article>
          <article className="glass rounded-3xl p-7">
            <p className="eyebrow text-pink-400">One-off custom shirts</p>
            <h2 className="my-3 text-3xl font-black">Typical: $25–$50+</h2>
            <p className="muted">Lucent Print&apos;s current custom-shirt base price is $25.50. Garment upgrades, sizes, placements, and artwork can change the total.</p>
            <a className="mt-4 inline-flex text-blue-400 underline" href="https://www.rushordertees.com/blog/how-much-custom-t-shirts-cost/" rel="noreferrer">Read the custom-shirt pricing guide →</a>
          </article>
        </div>
        <div className="glass mt-6 rounded-3xl p-7">
          <h2 className="text-2xl font-black">Sublimation shirts</h2>
          <p className="muted mt-2">Available starting September 28, 2026. Typical small-business sublimation pricing is about $25–$45 per shirt; Lucent Print pricing will be confirmed after the garment and artwork are reviewed.</p>
          <a className="mt-4 inline-flex text-blue-400 underline" href="https://silhouetteu.com/blogs/new/how-much-to-charge-for-sublimation-shirts" rel="noreferrer">Read the sublimation pricing guide →</a>
        </div>
        <p className="muted mt-8 text-sm">References open in the same browser for better compatibility with phones and messaging apps. Marketplace prices can change at any time.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/shop">Shop products</Link>
          <Link className="btn btn-secondary" href="/custom-studio">Custom apparel</Link>
        </div>
      </div>
    </section>
  );
}
