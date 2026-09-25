import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="shell grid gap-8 md:grid-cols-4">
        <div>
          <b>LUCENT PRINT</b>
          <p className="muted">Live. Create. Inspire.</p>
          <Link className="muted mt-3 inline-block break-all hover:text-white" href="/contact">
            lu@lucentprintlic.com
          </Link>
        </div>
        <div>
          <b>Shop</b>
          <div className="muted mt-3 grid gap-2">
            <Link href="/shop">3D printing</Link>
            <Link href="/custom-studio">Custom apparel</Link>
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
