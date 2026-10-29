import Image from "next/image";
export function BrandDivider() { return <div className="lp-four-divider" aria-hidden="true" />; }
export function BrandMasthead({compact=false}:{compact?:boolean}) {
 return <div className={`lp-brand-masthead ${compact ? "lp-brand-compact" : ""}`}><div className="lp-brand-center"><Image src="/images/brand/lucent-code-cascade-front-color-fours.svg" alt="Lucent Print — Live. Create. Inspire." width={900} height={300} unoptimized priority={!compact}/></div><BrandDivider/></div>;
}
