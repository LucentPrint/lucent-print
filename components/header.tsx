"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Shirt, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setOpen } = useCart();
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="shell flex h-20 items-center gap-4">
        <Link href="/" onClick={closeMenu} className="mr-auto flex shrink-0 items-center gap-3">
          <Image
            src="/images/lucent-logo.webp"
            width={48}
            height={48}
            alt="Lucent Print logo"
            className="rounded-xl"
          />
          <span className="font-black tracking-[.18em]">
            LUCENT
            <small className="block text-[10px] tracking-[.3em] text-zinc-400">PRINT</small>
          </span>
        </Link>

        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={`${menuOpen ? "flex" : "hidden"} absolute left-4 right-4 top-20 max-h-[calc(100dvh-6rem)] flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl xl:static xl:flex xl:max-h-none xl:flex-row xl:items-center xl:overflow-visible xl:whitespace-nowrap xl:border-0 xl:bg-transparent xl:p-0 xl:text-sm xl:shadow-none`}
        >
          <Link
            href="/shop"
            onClick={closeMenu}
            className="rounded-xl bg-blue-500/15 px-4 py-3 font-black text-blue-200 transition hover:bg-blue-500/25 xl:px-3"
          >
            3D Printing
          </Link>
          <Link
            href="/custom-studio"
            onClick={closeMenu}
            className="flex items-center gap-2 rounded-xl bg-pink-500/15 px-4 py-3 font-black text-pink-200 transition hover:bg-pink-500/25 xl:px-3"
          >
            <Shirt size={17} />
            Custom Apparel
          </Link>
          <Link href="/tumblers" onClick={closeMenu} className="rounded-xl bg-orange-500/15 px-4 py-3 font-black text-orange-200 transition hover:bg-orange-500/25 xl:px-3">
            Tumblers
          </Link>
          <Link
            href="/party-planning"
            onClick={closeMenu}
            className="rounded-xl bg-blue-500/10 px-4 py-3 font-black text-pink-200 transition hover:bg-pink-500/20 xl:px-3"
          >
            Party Planning &amp; Reservations
          </Link>
          <Link href="/our-work" onClick={closeMenu} className="px-3 py-2">
            Our Work
          </Link>
          <Link href="/wholesale" onClick={closeMenu} className="px-3 py-2">
            Bulk Orders
          </Link>
          <Link href="/account" onClick={closeMenu} className="px-3 py-2 xl:hidden">
            My Account
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="shrink-0 rounded-lg p-2 xl:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <Link href="/account" onClick={closeMenu} aria-label="Account" className="hidden shrink-0 sm:block">
          <User />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="relative shrink-0 rounded-lg p-2"
          aria-label="Cart"
        >
          <ShoppingBag />
          <span className="absolute -right-1 -top-1 rounded-full bg-pink-600 px-1.5 text-xs">
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}
