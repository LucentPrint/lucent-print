import { CascadeMotionControl } from "./cascade-background";
import { BrandDivider } from "./brand-masthead";
import { ThemeControl } from "./theme-control";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <BrandDivider/><div className="shell grid gap-8 md:grid-cols-4">
        <div>
          <div className="lp-footer-logo"><Image src="/images/brand/lucent-code-cascade-front-color-fours.svg" alt="Lucent Print — Live. Create. Inspire." width={240} height={80} unoptimized /></div>
          <Link className="muted mt-3 inline-block break-all hover:text-white" href="/contact">
            lu@lucentprintlic.com
          </Link>
        </div>
        <div>
          <b>Shop &amp; services</b>
          <div className="muted mt-3 grid gap-2">
            <Link href="/apparel">Shirts &amp; Team Gear</Link>
            <Link href="/custom">Custom Prints &amp; Gifts</Link>
            <Link href="/events-business">Events &amp; Business Orders</Link>
            <Link href="/shop">3D prints &amp; collectibles</Link>
            <Link href="/custom-studio">Custom apparel</Link>
            <Link href="/tumblers">Tumblers</Link>
            <Link href="/party-planning">Party Planning &amp; Reservations</Link>
            <Link href="/our-work">Our Work</Link>
            <Link href="/wholesale">Bulk orders</Link>
          </div>
        </div>
        <div>
          <b>Explore</b>
          <div className="muted mt-3 grid gap-2">
            <Link href="/design-vault">Design Vault</Link>
            <Link href="/pricing">Price list</Link>
            <Link href="/loyalty">Loyalty</Link>
          </div>
        </div>
        <div>
          <ThemeControl />
          <CascadeMotionControl />
          <b>Support</b>
          <div className="muted mt-3 grid gap-2">
            <Link href="/contact">Email us</Link>
            <Link href="/policies#shipping">Shipping policy</Link>
            <Link href="/policies#refunds">Refund & return policy</Link>
            <Link href="/account">Account</Link>
            <Link href="/policies">All policies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
