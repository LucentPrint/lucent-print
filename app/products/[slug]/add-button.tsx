"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { isApparelProduct } from "@/lib/product-sections";
import { APPAREL_SIZES } from "@/lib/promotions";

export function AddButton({ product }: { product: Product }) {
  const { add } = useCart();
  const apparel = isApparelProduct(product);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(apparel ? "S" : "");

  return <div className={`mt-8 grid gap-3 ${apparel ? "grid-cols-[140px_110px_1fr]" : "grid-cols-[110px_1fr]"}`}>
    {apparel && <label className="grid gap-1 text-sm font-bold">Size<select aria-label="Shirt size" className="input" value={size} onChange={(event)=>setSize(event.target.value)}>{APPAREL_SIZES.map((option)=><option key={option} value={option}>{option}</option>)}</select></label>}
    <label className="grid gap-1 text-sm font-bold">Quantity<input aria-label="Quantity" className="input text-center" type="number" min="1" max="99" value={quantity} onChange={event=>setQuantity(Math.max(1,Math.min(99,Number(event.target.value)||1)))}/></label>
    <button onClick={()=>add(product,size||undefined,quantity)} className="btn btn-primary self-end">Add {quantity} to cart</button>
  </div>;
}
