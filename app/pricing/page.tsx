import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { COMING_SOON_IMAGE } from "@/lib/product-images";
import { DRINKWARE, SHIRT_PRICES } from "@/lib/custom-pricing";
import { money } from "@/lib/commerce";

export const metadata = { title: "Custom Print Price List", description: "Lucent Print drinkware, sublimation and heat-transfer shirt prices, team rates and custom design fees." };
function PriceRows({ rows }: { rows: Array<[string, string, string?]> }) {
  return <dl className="divide-y divide-white/10">{rows.map(([label, price, note]) => <div key={label} className="flex items-start justify-between gap-5 py-4"><div><dt className="font-bold">{label}</dt>{note && <dd className="muted mt-1 text-sm">{note}</dd>}</div><dd className="shrink-0 font-bold text-blue-300">{price}</dd></div>)}</dl>;
}
export default function PricingPage() {
  return <section className="section"><div className="shell max-w-6xl">
    <p className="eyebrow">Lucent Print · Las Vegas</p><h1 className="title my-6">Custom Print Price List</h1>
    <p className="muted max-w-3xl text-lg">Personalized drinkware and shirts, printed by hand in Las Vegas. Name personalization, your own photo or logo, and a design proof before printing are included.</p>
    <div className="my-8 flex flex-wrap gap-3">{[["Drinkware","drinkware"],["Sublimation shirts","sublimation"],["Heat transfer shirts","heat-transfer"],["Custom design","custom-design"]].map(([label,id])=><a key={id} className="btn btn-secondary" href={`#${id}`}>{label}</a>)}<a className="btn btn-secondary" href="/documents/Lucent_Print_Price_List.pdf" download>Download price list</a></div>
    <section id="drinkware" className="scroll-mt-24 py-8"><h2 className="text-3xl font-black">Drinkware</h2><p className="muted mt-3">Full-color sublimation print, including a name. Names can differ on each piece in a bulk order.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{DRINKWARE.map(item=><article key={item.name} className="glass overflow-hidden rounded-2xl"><div className="relative aspect-[3/2]"><ProductImage src={COMING_SOON_IMAGE} alt={item.name} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" className="object-contain"/></div><div className="p-5"><h3 className="text-xl font-black">{item.name}</h3><p className="mt-3 text-2xl font-bold">{money(item.price)}</p><p className="muted mt-3 text-sm">{item.description}</p><p className="mt-4 text-sm text-blue-300">{item.bulkMinimum}+ pieces: {money(item.bulkPrice)} each</p><Link className="mt-4 inline-block text-pink-300 underline" href="/contact">Request a drinkware order</Link></div></article>)}</div>
    </section>
    {(["sublimation", "heat-transfer"] as const).map(method=>{
      const p=SHIRT_PRICES[method]; const sub=method==='sublimation';
      const rows: Array<[string,string,string?]> = [
        ["Adult · front",money(p.adult.front),sub?"Up to 8.5 × 11 in.":"Up to 8 × 10 in."],
        ["Adult · back only",money(p.adult.back),sub?"Full back, up to 13 × 15 in.":"Up to 8 × 10 in."],
        ...(sub?[["Adult · large front",money(SHIRT_PRICES.sublimation.adult['large-front']),"Up to 13 × 15 in."] as [string,string,string]]:[]),
        ["Adult · front + back",money(p.adult['front-back']),sub?"Front plus full back.":"Two prints, each up to 8 × 10 in."],
        ["Youth · front",money(p.youth.front),"Youth XS–XL."],["Youth · back only",money(p.youth.back)], ["Youth · front + back",money(p.youth['front-back'])],
      ];
      return <section key={method} id={method} className="glass my-8 scroll-mt-24 rounded-3xl p-6 md:p-8"><h2 className="text-3xl font-black">{sub?'Sublimation Shirts':'Heat Transfer Shirts'}</h2><p className="muted mt-3">{sub?'Listed prices include a 100% polyester performance tee in White or Sport Grey. Other light colors and polyester-cotton blends are available for review. Sublimation starts September 28, 2026.':'Listed prices include a 100% cotton tee in any color, including black. Other compatible fabrics can be reviewed with your order.'}</p><div className="mt-6 grid gap-8 lg:grid-cols-2"><PriceRows rows={rows}/><div><h3 className="text-xl font-bold text-pink-300">Team orders · 12+ shirts</h3><PriceRows rows={[["Adult · front",`${money(p.teamAdult.front)} each`],["Adult · front + back",`${money(p.teamAdult['front-back'])} each`],["Youth · front",`${money(p.teamYouth.front)} each`],["Youth · front + back",`${money(p.teamYouth['front-back'])} each`]]}/><p className="muted mt-3 text-sm">Size add-on: 2XL +$3 · 3XL +$5. Team rates apply to the listed print layouts.</p>{!sub&&<><h3 className="mt-8 text-xl font-bold">Bring your own shirt</h3><p className="muted mt-2 text-sm">Cotton or cotton blend.</p><PriceRows rows={[["Your shirt · front or back","$13.00"],["Your shirt · front + back","$20.00"]]}/><p className="muted mt-3 text-sm">Designs larger than 8 × 10 in. are quoted per order.</p></>}</div></div><Link className="btn btn-primary mt-6" href="/custom-studio#order">Build a shirt order</Link></section>;
    })}
    <section id="custom-design" className="glass scroll-mt-24 rounded-3xl p-6 md:p-8"><h2 className="text-3xl font-black">Custom Design</h2><PriceRows rows={[["Name, text or number personalization","Included"],["Your own photo, logo or finished artwork","Included"],["Custom design from your idea","$15 per design"],["Complex artwork, illustration, logo redraw or cleanup","From $35","Quoted per order."],["Extra revisions after the first 2","$5 each"]]}/><p className="muted mt-3">One design fee covers an entire team or bulk order. Every order gets a proof before printing.</p></section>
    <div className="my-8 grid gap-6 md:grid-cols-2"><div className="glass rounded-2xl p-6"><h2 className="text-xl font-bold">Pickup &amp; shipping</h2><p className="muted mt-3">Free local pickup in Las Vegas. Shipping is calculated when you order.</p></div><div className="glass rounded-2xl p-6"><h2 className="text-xl font-bold">Place an order</h2><p className="muted mt-3">Send your product, quantity, design idea and sizes.</p><Link className="mt-3 inline-block text-blue-300 underline" href="/contact">lu@lucentprintlic.com</Link></div></div>
    <p className="muted text-sm">Prices effective September 2026 · Subject to change. Garments, artwork and production dates are confirmed before printing.</p>
  </div></section>;
}
