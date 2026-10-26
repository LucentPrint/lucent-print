"use client";

import { ThemeControl } from "./theme-control";
import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setOpen } = useCart();
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="shell lp-header-inner">
        <Link href="/" onClick={closeMenu} className="lp-header-logo" aria-label="Lucent Print home">
          <Image src="/images/brand/lucent-code-cascade-front.svg" width={240} height={80} alt="Lucent Print — Live. Create. Inspire." unoptimized priority />
        </Link>

        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={`${menuOpen ? "flex" : "hidden"} absolute left-4 right-4 top-20 max-h-[calc(100dvh-6rem)] flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl xl:static xl:flex xl:max-h-none xl:flex-row xl:items-center xl:overflow-visible xl:whitespace-nowrap xl:border-0 xl:bg-transparent xl:p-0 xl:text-sm xl:shadow-none`}
        >
          {[['/explore','Shop'],['/custom','Custom Orders'],['/events-business','Events'],['/our-work','Our Work'],['/about','About']].map(([href,label]) => <Link key={href} href={href} onClick={closeMenu} className="rounded-lg px-3 py-3 font-bold text-zinc-200 transition hover:bg-white/10 hover:text-[#40ef38]">{label}</Link>)}
          <Link href="/contact" onClick={closeMenu} className="rounded-lg bg-[#40ef38] px-4 py-3 font-bold text-black">Request a Quote</Link>
          <Link href="/account" onClick={closeMenu} className="px-3 py-2 xl:hidden">
            My Account
          </Link>
        <div className="xl:hidden"><ThemeControl /></div>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lp-menu-toggle shrink-0 rounded-lg p-2 xl:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <Link href="/account" onClick={closeMenu} aria-label="Account" className="lp-header-account hidden shrink-0 sm:block">
          <User />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="lp-header-cart relative shrink-0 rounded-lg p-2"
          aria-label="Cart"
        >
          <ShoppingBag />
          <span className="absolute -right-1 -top-1 rounded-full bg-[#ff6b18] text-black px-1.5 text-xs">
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}
