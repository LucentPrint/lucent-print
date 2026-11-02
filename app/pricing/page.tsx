import Link from "next/link";
import guide from "@/lib/approved-price-guide.json";
export const metadata = { title: "Print & Gift Prices", description: "Lucent Print base prices for shirts, drinkware, sublimation gifts and personalization. Confirm availability and a quote before ordering." };
function PriceRows({ rows }: { rows: string[][] }) {
  return <dl className="divide-y divide-current/15">{rows.map(([label, price]) => <div key={label} className="flex flex-wrap items-start justify-between gap-3 py-4"><dt className="font-bold">{label}</dt><dd className="font-bold">{price}</dd></div>)}</dl>;
}
export default function PricingPage() {
 return <section className="section"><div className="shell max-w-4xl">
 <p className="eyebrow">Lucent Print · Base prices in USD</p><h1 className="title my-6">Your ideas. Clear starting prices.</h1>
 <p className="muted text-lg">Choose a catalog design or bring a custom idea. These are base prices for quote requests, not a statement that a particular blank or design is in stock.</p>
 <div className="my-8 flex flex-wrap gap-3"><Link className="btn btn-primary" href="/contact">Request a quote</Link><Link className="btn btn-secondary" href="/sublimation">Explore sublimation</Link><a className="btn btn-secondary" href="/documents/Lucent_Print_Price_List.pdf" download>Download price guide</a></div>
 <section id="sublimation" className="glass scroll-mt-24 rounded-3xl p-6 md:p-8"><span id="drinkware"/><h2 className="text-3xl font-black">Shirts, drinkware &amp; gifts</h2><PriceRows rows={guide.prices}/></section>
 <section id="custom-design" className="glass my-8 scroll-mt-24 rounded-3xl p-6 md:p-8"><h2 className="text-3xl font-black">Design &amp; personalization</h2><PriceRows rows={guide.fees}/><p className="muted mt-4">Confirm the requested personalization and final artwork scope with your quote. Complex artwork is quoted individually.</p></section>
 <section className="glass rounded-3xl p-6 md:p-8"><h2 className="text-2xl font-black">Before you order</h2><p className="muted mt-4">All existing shirt sizes are available: 2T–5T, YXS–YXL and adult S–3XL. Confirm garment color, blank material, production capacity and timing before ordering. Collection shirts include the pictured placements. Decorative plates are for display unless suitability for another use is confirmed.</p><p className="muted mt-4">This guide does not activate held designs or change existing product checkout. Some existing listings still use their previous checkout prices; request a confirmed quote for the prices above. Shipping and applicable tax are separate. Other services and one-time invoice payments keep their own agreed amounts.</p><Link className="mt-5 inline-block underline" href="/contact">Send your item, quantity and artwork idea</Link></section>
 </div></section>;
}
