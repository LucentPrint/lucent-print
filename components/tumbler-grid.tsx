"use client";

import Image from "next/image";
import { useState } from "react";
import { TUMBLERS } from "@/lib/tumblers";
import { money } from "@/lib/commerce";
import type { Product } from "@/lib/types";
import { useCart } from "./cart-provider";

function TumblerCard({ tumbler, product }: { tumbler: (typeof TUMBLERS)[number]; product?: Product }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [personalization, setPersonalization] = useState("");
  const available = product?.status === "active" && product.price > 0 && product.inventory > 0;
  const maxQuantity = Math.min(99, product?.inventory ?? 1);

  return (
    <article id={tumbler.slug} className="glass flex scroll-mt-24 flex-col overflow-hidden rounded-3xl">
      <a href={tumbler.image} target="_blank" rel="noreferrer" aria-label={`View full photo of ${tumbler.name}`} className="relative block aspect-square bg-[#faf9f7]">
        <Image src={tumbler.image} alt={tumbler.alt} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-contain" />
      </a>
      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow text-orange-300">Tumblers</p>
        <h3 className="mt-3 text-2xl font-black">{tumbler.name}</h3>
        <p className="mt-3 text-2xl font-black text-blue-300">{money(product?.price ?? tumbler.price)}</p>
        <p className="muted mt-3 flex-1">{tumbler.description}</p>
        <label className="mt-5 text-sm font-bold">
          Personalization <span className="muted font-normal">(optional)</span>
          <input className="input mt-2" maxLength={40} value={personalization} onChange={(event)=>setPersonalization(event.target.value)} placeholder="Name or short text" />
        </label>
        <label className="mt-4 text-sm font-bold">
          Quantity
          <input className="input mt-2 w-24 text-center" type="number" min="1" max={maxQuantity} value={quantity} onChange={(event)=>setQuantity(Math.max(1,Math.min(maxQuantity,Number(event.target.value)||1)))} />
        </label>
        <button disabled={!available} className="btn btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-50" onClick={()=>product&&add(product,personalization.trim()||undefined,quantity)}>
          {available ? `Add ${quantity} to cart` : "Currently unavailable"}
        </button>
      </div>
    </article>
  );
}

export function TumblerGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TUMBLERS.map((tumbler) => <TumblerCard key={tumbler.slug} tumbler={tumbler} product={products.find((item)=>item.slug===tumbler.slug)} />)}
    </div>
  );
}
