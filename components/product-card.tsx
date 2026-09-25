"use client";

import { Bell, Heart, ShoppingBag } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/commerce";
import { getMarketComparison } from "@/lib/pricing";
import { isApparelProduct } from "@/lib/product-sections";
import { catalogUnitPrice } from "@/lib/custom-pricing";
import { APPAREL_SIZES } from "@/lib/promotions";
import type { Product } from "@/lib/types";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const coming = p.status === "coming_soon" || p.price <= 0;
  const comparison = getMarketComparison(p.collection);
  const [quantity, setQuantity] = useState(1);
  const apparel = isApparelProduct(p);
  const [size, setSize] = useState(apparel ? "S" : "");

  return (
    <article className="glass card group">
      <div className="relative h-64 overflow-hidden">
        <ProductImage
          src={p.images[0]}
          alt={p.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <button
          aria-label="Toggle wishlist"
          onClick={() => wishlist.toggle(p)}
          className="absolute right-3 top-3 rounded-full bg-black/70 p-2"
        >
          <Heart className={wishlist.has(p.id) ? "fill-pink-500 text-pink-500" : ""} />
        </button>
        <span className="badge absolute left-3 top-3">{p.status.replaceAll("_", " ")}</span>
      </div>
      <div className="p-5">
        <p className="eyebrow">{p.collection}</p>
        <h3 className="my-2 text-xl font-black">{p.name}</h3>
        <p className="muted min-h-12">{p.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <b className="text-xl">{coming ? "Coming soon" : money(catalogUnitPrice(p,size,quantity))}</b>
          <Link className="ml-auto text-sm text-blue-400" href={`/products/${p.slug}`}>
            Details
          </Link>
          {!coming && (
            apparel ? <label className="flex items-center gap-2 text-sm"><span>Size</span><select aria-label={`Size for ${p.name}`} className="input w-24 py-2" value={size} onChange={(event)=>setSize(event.target.value)}>{APPAREL_SIZES.map((option)=><option key={option} value={option}>{option}</option>)}</select></label> : null
          )}
          {!coming && (
            <label className="flex items-center gap-2 text-sm">
              <span>Qty</span>
              <input aria-label={`Quantity for ${p.name}`} className="input w-20 py-2 text-center" type="number" min="1" max="99" value={quantity} onChange={(event)=>setQuantity(Math.max(1,Math.min(99,Number(event.target.value)||1)))}/>
            </label>
          )}
          <button
            disabled={coming}
            title={coming ? "Coming soon" : "Add to cart"}
            onClick={() => add(p, size || undefined, quantity)}
            className="rounded-lg bg-white p-2 text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {coming ? <Bell size={18} /> : <ShoppingBag size={18} />}
          </button>
        </div>
        {!coming && (
          <p className="mt-3 text-xs text-zinc-400">
            {comparison.label}: {comparison.range}.{" "}
            <Link className="text-blue-400 underline" href="/pricing">View price list</Link>
          </p>
        )}
      </div>
    </article>
  );
}
