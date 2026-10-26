import { BrandMasthead } from "@/components/brand-masthead";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/data";
import { isApparelProduct } from "@/lib/product-sections";
export const metadata={title:"Shirts & Team Gear"};
export default async function Page(){
 const products=(await getProducts()).filter(isApparelProduct);
 return <div className="lucent-landing shell"><BrandMasthead compact/><p className="lp-kicker">WEAR YOUR PERSONALITY</p><h1>Shirts & team gear.</h1><p className="lp-intro">Explore designs currently in our catalog, or start a custom order for your team, family or business.</p><div className="lp-actions"><Link className="lp-button lp-button-outline" href="/custom-studio">Request a custom shirt</Link><Link className="lp-text-link" href="/our-work">See completed projects →</Link></div>{products.length ? <div className="grid-auto mt-12">{products.map(p=><ProductCard key={p.id} p={p}/>)}</div> : <div className="lp-empty" role="status"><h2>No apparel listings to display right now.</h2><p>You can still browse completed projects or send us a custom shirt request. This page shows catalog listings only when they’re available.</p><Link href="/custom-studio" className="lp-text-link">Start a custom request →</Link></div>}</div>;
}
