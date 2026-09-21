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
        <Link href="/" onClick={closeMenu} className="mr-auto flex items-center gap-3">
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
          className={`${menuOpen ? "flex" : "hidden"} absolute left-4 right-4 top-20 flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          <Link
            href="/shop"
            onClick={closeMenu}
            className="rounded-xl bg-blue-500/15 px-4 py-3 font-black text-blue-200 transition hover:bg-blue-500/25"
          >
            3D Printing
          </Link>
          <Link
            href="/custom-studio"
            onClick={closeMenu}
            className="flex items-center gap-2 rounded-xl bg-pink-500/15 px-4 py-3 font-black text-pink-200 transition hover:bg-pink-500/25"
          >
            <Shirt size={17} />
            Custom Apparel
          </Link>
          <Link href="/our-work" onClick={closeMenu} className="px-3 py-2">
            Our Work
          </Link>
          <Link href="/wholesale" onClick={closeMenu} className="px-3 py-2">
            Bulk Orders
          </Link>
          <Link href="/account" onClick={closeMenu} className="px-3 py-2 lg:hidden">
            My Account
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <Link href="/account" onClick={closeMenu} aria-label="Account" className="hidden sm:block">
          <User />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="relative rounded-lg p-2"
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
