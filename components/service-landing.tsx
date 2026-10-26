import { BrandMasthead } from "@/components/brand-masthead";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function ServiceLanding({eyebrow,title,description,items}:{eyebrow:string;title:string;description:string;items:{title:string;description:string;href:string;action:string}[]}) {
 return <div className="lucent-landing shell"><BrandMasthead compact/><p className="lp-kicker">{eyebrow}</p><h1>{title}</h1><p className="lp-intro">{description}</p><div className="lp-service-grid">{items.map(item=><article key={item.title}><h2>{item.title}</h2><p>{item.description}</p><Link className="lp-text-link" href={item.href}>{item.action}<ArrowUpRight size={18}/></Link></article>)}</div><p className="lp-service-note">Not sure where to start? <Link href="/contact">Tell us what you have in mind.</Link></p></div>;
}
